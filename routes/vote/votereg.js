
module.exports = function(app, connectionPool) {

    app.get('/vote/votereg', function(req, res, next) {

        /* session 없을 땐 로그인 화면으로*/
        if(!req.session.user_name) {
            req.session.returnTo = '/vote/votereg';
            //req.session.returnTo = req.path;
            res.redirect('/');
        }else{
        
            connectionPool.getConnection(function(err, connection) {
                connection.query('select u.* , "N" as load_yn from user u where u.user_name = ? and u.emp_num = ?;', [req.session.user_name, req.session.emp_num], function(error, rows1) {
    
                    if(error) {
                        connection.release();
                        throw error;
                    }else {
                        
                        connection.query('select vm.*, date_format(vm.reg_dtm, "%y/%m/%d") as regDtShow' 
                                        + ' from vote_master vm where vm.reg_user_id = ? and vm.state <> "N"'
                                        + ' order by vm.reg_dtm desc'
                                        + ' limit 5;', [req.session.user_id], function(error, rows2){
                            if(error){
                                connection.release();
                                throw error;
                            
                            }else{
                                if(rows1.length > 0) {
                                    res.render('vote/votereg', {data1 : rows1[0], data2 : rows2, session : req.session});
                                    connection.release();
                                }else {
                                    res.redirect('/');
                                    connection.release();
                                }    
                            }
                        });
                    }
                });
            });
        }
    });
    

    app.post('/voteload', function(req, res, next) {
        connectionPool.getConnection(function(err, connection) {
            //console.log(req.body);
            connection.query('select vm.*, (select u.user_name from user u where u.id = vm.reg_user_id) as user_name, "Y" as load_yn from vote_master vm where vm.vote_id = ?;', [req.body.vote_load], function(error, rows1){
            
                connection.beginTransaction(function(err) {
                    if(err) {
                        connection.release();
                        throw err;
                    }
                    
                    else {
                        connection.query('select vm.*, date_format(vm.reg_dtm, "%y/%m/%d") as regDtShow' 
                                    + ' from vote_master vm where vm.reg_user_id = ? and vm.state <> "N"'
                                    + ' order by vm.reg_dtm desc'
                                    + ' limit 5;', [req.session.user_id], function(error, rows2){
                            
                            connection.beginTransaction(function(err) {
                                if(err) {
                                    connection.release();
                                    throw err;
                                }
                                
                                else {
                                    connection.query('select * from vote_items where vote_id = ?;', [req.body.vote_load], function(error, rows3){
                                        
                                        connection.beginTransaction(function(err) {
                                            if(error){
                                                connection.release();
                                                throw error;
                                            
                                            }else{
                                                if(rows1.length > 0) {
                                                    res.render('vote/votereg', {data1 : rows1[0], data2 : rows2 , data3 : rows3, session : req.session});
                                                    connection.release();
                                                }else {
                                                    res.redirect('/');
                                                    connection.release();
                                                }    
                                            }
                                        });
                                    });
                                }
                            });
                        
                        });
                    }
                });//connection.beginTransaction
            });
            
        });//connectionPool.getConnection
    });//post
    
    

    // 투표 등록 시 진행 될 사항
    // 1. vote_master 테이블 insert
    // 2. vote_items 테이블 insert
    // 3. 투표 등록 메일 발송(메일 발송 여부에 따라)
    app.post('/vote_regist', function(req, res, next) {
        connectionPool.getConnection(function(err, connection) {
            //console.log(req.body);
            
            connection.beginTransaction(function(err) {
                if(err) {
                    connection.release();
                    throw err;
                }
                
                ////
                
                connection.query('insert into vote_master(subject, comment, reg_user_id, reg_dtm, deadline, modify_dtm, state, parti_org_id, multi_yn, secret_yn, add_item_yn) ' 
                               + 'values(?,?,?,date_format(sysdate(), "%Y%m%d%H%i%s"),?,date_format(sysdate(), "%Y%m%d%H%i%s"),"P",'
                                     + '(case ? when "Team" then (select team_id from user where id = ?) when "SM" then (select sm_id from user where id = ?) else 0 end),?,?,?);'
                             , [req.body.vote_name, req.body.vote_contents, req.session.user_id, req.body.vote_deadline, req.body.parti_org_id , req.session.user_id , req.session.user_id , req.body.multi_yn, req.body.secret_yn, req.body.add_item_yn], function(error, rows) {
                            if(error){
                                console.log("ERROR1");
                                
                                connection.rollback(function() {
                                    connection.release();
                                    console.error("insert vote_master rollback error");
                                    throw error;
                                });
                                res.render('happyday/error', {data : rows[0], session : req.session});  //에러처리?!?!?
                                connection.release();
                                throw error;
                            }else {
                                console.log("Success Insert1");
                                
                                var count = 0;
                                for(var i=0; i<req.body.vote_item.length; i++) {
                                // 2. vote_items 테이블에 아이템 항목 insert
                                    if(req.body.vote_item[i] != ""){
                                        count++;
                                        connection.query('insert into vote_items (vote_id, item_id, item_name, reg_user_id, reg_dtm) select vote_id, ?, ?, reg_user_id, date_format(sysdate(), "%Y%m%d%H%i%s") as reg_dtm from vote_master  where vote_id = (select max(vote_id) from vote_master)'
                                        , [count, req.body.vote_item[i]], function(error, rows){
                                            if(error){
                                                connection.release();
                                                throw error;
                                            }
                                        });
                                    }
                                 }

                                if(rows.affectedRows > 0) {
                                    connection.commit(function(err) {
                                        if(err) {
                                            console.error("commit error : " + err);
                                            connection.rollback(function() {
                                            connection.release();
                                            console.error("update user rollback error");
                                            throw error;
                                            });
                                        }
                                    //commit success
                                    });//commit
                                }else {
                                    //fail
                                    connection.release();
                                    res.redirect('happyday/error');     //에러처리?!?!?
                                }
                                
                                connection.release();
                                res.redirect('../vote/votemain');
                                    
                                // /* 투표 등록 메일 발송 */
                                // req.body.user_name = req.session.user_name;
                                // req.body.type = 'VOTEREG';
                                // const common = new (require("../common/common.js"))();
                                // common.sendMail(req.body);
                                
                            }
                        });
                
            });//connection.beginTransaction
        });//connectionPool.getConnection
    });//post
    
}