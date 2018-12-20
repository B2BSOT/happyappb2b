
module.exports = function(app, connectionPool) {

    // Use the session middleware
    //app.use(session({ secret: 'keyboard cat', cookie: { maxAge: 60000 }}));

    /* GET home page. */
    app.get('/', function(req, res) {
        var sess = req.session

        //로그인 후 리턴을 위함
        console.log("redirURL1323 : " + redirURL);
        var redirURL = req.session.returnTo;
        delete req.session.returnTo;
        console.log("req.session.returnTo2 : " + req.session.returnTo);
        console.log("redirURL : " + redirURL);

        if(sess.views) {
            res.redirect('/happyday/hdmain'); // /main url에서 다시 세션 존재 검사
        }else {
            res.render('index', { title: 'Happy App', redirURL: redirURL });
        }

    });

    app.post('/login', findUser, makeLoginHst, (req, res, next) => {
        // console.log(req.body);

        if(req.user.length > 0) {
            /* session 내에 사용자 정보 저장 */

            req.session.regenerate(function (err) {
              if(err){
                console.log(err);
              } else {
                // console.log("index.js : "+ rows[0]);
                req.session.user_name = req.user[0].user_name;
                req.session.emp_num = req.user[0].emp_num;
                req.session.team_id = req.user[0].team_id;
                req.session.sm_id = req.user[0].sm_id;
                req.session.mileage = req.user[0].mileage;
                req.session.user_id = req.user[0].id;
                //KJB
                req.session.happy_point = req.user[0].happy_point;

                 console.log("req.session.returnTo3 : "+req.body.redir_url);

                if(req.body.redir_url){
                    var redirURL = req.body.redir_url;
                    delete req.body.redir_url;
                    res.redirect(redirURL);
                }else{
                    res.redirect('happyday/hdmain'); // /main url에서 다시 세션 존재 검사
                }
              }
            });
        }else {
            res.redirect('/');
        }
    });

    app.post('/login', (req, res) => {
        /* 로그인시 Error 처리를 위한 route */
        res.redirect('/');
    });


    function findUser(req, res, next) {
        connectionPool.getConnection((err, connection) => {
            connection.query('select * from user' +
                             ' where 1=1 and emp_num = ?;', [req.body.emp_num], function(error, rows) {
                if(error) {
                    connection.release();
                    next(new Error("route findUser error: " + error));
                }else {
                    if(rows.length > 0) {
                        connection.release();
                        req.user = rows;
                        next();
                    }else {
                        next('route');
                    }
                }
            });
        });
    }

    function makeLoginHst(req, res, next) {
        //console.log(req.user);

        connectionPool.getConnection((err, connection) => {
            /*
             * 하루에 한번 로그인 이력 생성(insert)
             * 두번 이상의 경우 최종 로그인 시간 및 횟수만 수정(update)
             */
            connection.query('select * from login_hst' +
                             ' where login_id = ?' +
                             ' and login_dt = date_format(sysdate(), "%Y%m%d");', [req.user[0].id, req.body.emp_num], function(error, rows) {
                if(error) {
                    connection.release();
                    next(new Error("route makeLoginHst error: " + error));
                }else {
                    if(rows.length > 0) {
                        /* 당일 로그인 이력 존재하므로 UPDATE */
                        connection.query('update login_hst' +
                                         '   set login_cnt = login_cnt+1, update_dtm = date_format(sysdate(), "%Y%m%d%H%i%s")' +
                                         ' where login_id = ? and login_dt = date_format(sysdate(), "%Y%m%d");', req.user[0].id, function(error, rows) {
                            if(error) {
                                connection.release();
                                next(new Error("route makeLoginHst update error: " + error));
                            }else {
                                connection.release();
                                next();
                            }
                        });
                    }else {
                        /* 당일 로그인 이력이 없으면 INSERT */
                        connection.query('insert into login_hst' +
                                         ' (login_id, reg_dtm, login_dt, login_cnt, update_dtm)' +
                                         ' values' +
                                         ' (?, date_format(sysdate(), "%Y%m%d%H%i%s"), date_format(sysdate(), "%Y%m%d"), 1, date_format(sysdate(), "%Y%m%d%H%i%s"))', req.user[0].id, function(error, rows) {
                            if(error) {
                                connection.release();
                                next(new Error("route makeLoginHst insert error: " + error));
                            }else {
                                /* 첫 로그인 시 마일리지 적립 */
                                var common = new (require('./common/common'))();
                                var result = common.setMileage(req, connection);

                                if(result) {
                                    connection.release();
                                    next(result);
                                }else {
                                    next();
                                }
                            }
                        });
                    }
                }
            });
        });
    }
};
