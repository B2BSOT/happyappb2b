var models = require('../../models');
var datetime = require('node-datetime');

module.exports = function(app) {
    app.get('/bestco/bestco', function(req, res, next) {
        
        /* session 없을 땐 로그인 화면으로 */
        if(!req.session.user_name) {
            res.redirect('/');
        }

        models.quiz_board.findAll()
        .then(quizboards => {
            res.render('bestco/bestco', {data : quizboards, session : req.session});    
        });
    });
    
    app.post('/create', function(req, res, nex) {
        console.log("PUT quizboard/create : "+ req.body.subject + " / " + req.body.content);
        
        /* session 없을 땐 로그인 화면으로 */
        if(!req.session.user_name) {
            res.redirect('/');
        }
        
        var dt = datetime.create();
        var formattedDate = dt.format('YmdHMS') // YYYYMMDDHH24MISS
        
        models.sequelize.transaction(function (t) {
            models.quiz_board.create({
                //board_id : 0, //autoincreted로 설정되어있어서 빼도 됨
                subject: req.body.subject,
                content: req.body.content,
                reg_dtm: formattedDate,
                days: 2,
                file_id: '' // nullable이지만 null 을 입력하면 에러나기 때문에 공백입력
            })
        }).then(function (result) {
          // Transaction has been committed
          // result is whatever the result of the promise chain returned to the transaction callback
          res.send({session : req.session});
          
        }).catch(function (err) {
          // Transaction has been rolled back
          // err is whatever rejected the promise chain returned to the transaction callback
          res.redirect('/');
        });

    });
}