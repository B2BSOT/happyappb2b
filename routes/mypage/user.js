const models = require('../../models');

// Sequalize Model 전역변수
const user = models.user;
const com_org = models.com_org;

module.exports = function(app, connectionPool) {

    app.get('/mypage/user', function(req, res, next) {

      /* session 없을 땐 로그인 화면으로 */
      if(!req.session.user_name) {
          req.session.returnTo = '/mypage/user';
          res.redirect('/');
      }else{
        findUser(req.session.user_id).then(user_info => {
          res.render('mypage/user', {data : user_info, session : req.session});
        }).catch(err => {
            console.log("\n*** ERROR : " + err);
            res.redirect('/');
        });;
      }
    });

    app.post('/user', function(req, res, next) {
        /* session 없을 땐 로그인 화면으로 */
        if(!req.session.user_name) {
            res.redirect('/');
        }

        if(req.session.user_id == req.body.user_id) {
          // console.log(req.body);
          models.sequelize.transaction(function (t) {
            user.update({
              {
                phone_number : req.body.phone_number,
                birthday : req.body.birthday,
                user_img : req.body.user_ing,
                home_town : req.body.home_town
              },
              {
                where: req.session.user_id
              }
            }).then(function (result) {
              res.json({success : "Updated Success", status : 200, user_img : req.body.user_img});

            }).catch(function (err) {
              res.json({success : "Updated fail", status : 500}); // express 사용 시

            });
          });
        }else {
          res.json({success : "FAIL(Wrong UserId)", status : 500});
        }
    });

    app.post('/imageinsert', function(req, res, next) {
         connectionPool.getConnection(function(err, connection) {
            /* 이미지 변경, 삽입시 DB INSERT */
            var common = new (require('../common/common'))();
            var result = common.insertImage(req, connection);

            if(result) {
                connection.release();
                throw result;
            }else {
                res.json({success : "Successfully", status : 200});
                connection.release();
            }
        });
    });

        app.post('/deleteExsistingImage', function(req, res, next) {
         connectionPool.getConnection(function(err, connection) {
            console.log('user.js로 들어옴 url : '+req.body.beforeImageUrl);
            /* 유저img값 DB에 있는지 확인 및 해당 해시로 삭제 */
            var common1 = new (require('../common/common'))();
            var result = common1.deleteImage(req, connection);

            if(result) {
                console.log('common.js에서 true 리턴')
                res.json({success : "Successfully", status : 200});
                connection.release();
                return result;
            }else {
                 console.log('common.js에서 false 리턴')
                connection.release();
                throw result;
            }
        });
    });

        app.post('/displayimage', function(req, res, next) {
         connectionPool.getConnection(function(err, connection) {
            /* 이미지 변경확정시, 삽입시 DB UPDATE */
            var common = new (require('../common/common'))();
            var result = common.displayImage(req, connection);

            if(result) {
                connection.release();
                throw result;
            }else {
                res.json({success : "Successfully", status : 200});
                connection.release();
            }
        });
    });

    /*************************************************************************
     * BELOW FUNCTIONS ARE QUERY MODULES
     *************************************************************************/
     function findUser(user_id) {
       user.belongsTo(com_org, {as: 'team', foreignKey: 'team_id'});
       user.belongsTo(com_org, {as: 'sm', foreignKey: 'sm_id'});

       return user.findOne({
         raw: true,
         include : [
           {
             model: com_org,
             as: 'team',
             attributes:[
               [models.Sequelize.col('org_nm'), 'team_name']
             ]
           },
           {
             model: com_org,
             as: 'sm',
             attributes:[
               [models.Sequelize.col('org_nm'), 'sm_name']
             ]
           }
         ],
         where : {
           id : user_id
         }
       }).then(result => {
         return result;
       });
     }

};
