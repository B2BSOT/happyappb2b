
module.exports = function(app, connectionPool) {

    app.get('/vote/voteupdate/:vote_id', function(req, res, next) {
       
        /* session 없을 땐 로그인 화면으로*/
        if(!req.session.user_name) {
            req.session.returnTo = '/vote/voteupdate/'+req.params.vote_id;
            //req.session.returnTo = req.path;
            res.redirect('/');
        }else{
            connectionPool.getConnection(function(err, connection) {
                //  console.log("aa");
    
                connection.query('select vm.*, concat(left(vm.deadline,4),"/",substring(vm.deadline,5,2),"/",substring(vm.deadline,7,2))as deadlinedtShow'
                                + ', concat(substring(vm.deadline,9,2),"시",substring(vm.deadline,11,2),"분") as deadlinetimeShow'
                                + ', substring(vm.deadline,1,8) as deadlinedtDB'
                                + ', substring(vm.deadline,9,4) as deadlinetimeDB'
                                + ', case when vm.parti_org_id like "1%" then "Team" else "SM" end partiShow'
                                + ', case when vm.multi_yn = "Y" then "checked" else "" end multiYnShow'
                                + ', case when vm.secret_yn = "Y" then "checked" else "" end secretYnShow'
                                + ', case when vm.add_item_yn = "Y" then "checked" else "" end addItemYnShow'
    //                            + ', case when vm.noti_yn = "Y" then "checked" else "" end notiYnShow'
                                + ', (select count(*) from vote_detail vd where vd.vote_id = vm.vote_id) as voteCount'
                                + ', case when vm.add_item_yn = "N" then "disabled" else "" end addItemButtonShow from vote_master vm where vm.vote_id = ?;'
                                , [req.params.vote_id], function(error, rows1) {
    
                    if(error) {
                        connection.release();
                        throw error;
                    }else {
                        connection.query('select * from vote_items where vote_id = ?;', [req.params.vote_id], function(error, rows2) {
                            if(error) {
                                connection.release();
                                throw error;
                            }else {
                                if(rows1.length > 0) {
                                    res.render('vote/voteupdate', {data1 : rows1[0], data2 : rows2, session : req.session});
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
    }); //get
    
    // 해피데이 등록 시 진행 될 사항
    // 1. vote_master 테이블 insert
    // 2. vote_items 테이블 insert
    // 3. 해피데이 등록 메일 발송(메일 발송 여부에 따라)
    app.post('/vote_update', function(req, res, next) {
        connectionPool.getConnection(function(err, connection) {
            console.log(req.body);

            connection.beginTransaction(function(err) {
                if(err) {
                    connection.release();
                    throw err;
                }
                
                ////
                
                connection.query('update vote_master '
                                +'set comment = ?, reg_user_id = ?, deadline = ?, modify_dtm = date_format(sysdate(), "%Y%m%d%H%i%s") '
                                +', parti_org_id = ? '
                                +', multi_yn = ?, secret_yn = ?, add_item_yn = ? '
                                +' where vote_id = ?;'
                             , [req.body.vote_contents, req.session.user_id, req.body.vote_deadline, req.body.parti_org_id, 
                                req.body.multi_yn, req.body.secret_yn, req.body.add_item_yn, req.body.vote_id], function(error, rows) {
                                    
                                console.log("vote_id"+ req.body.vote_id);
                                    
                            if(error){
                                console.log("ERROR1");
                                
                                connection.rollback(function() {
                                    connection.release();
                                    console.error("insert vote_master rollback error");
                                    throw error;
                                });
                                 res.redirect('../vote/votemain');  //에러처리?!?!?
                                connection.release();
                                throw error;
                            }else {
                                console.log("Success Insert1" + rows.affectedRows);


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
                                    connection.release();
                                    res.redirect('../vote/votedetail/'+req.body.vote_id);
                                }else {
                                    //fail
                                    connection.release();
                                    res.redirect('happyday/error');     //에러처리?!?!?
                                }
                            }
                        });
                

                /////

            });//connection.beginTransaction
        });//connectionPool.getConnection
    });//post
    
}