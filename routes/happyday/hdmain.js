const models = require('../../models');
const datetime = require('node-datetime');

// Sequalize Model 전역변수
const happyday_master = models.happyday_master;
const happyday_user_hst = models.happyday_user_hst;
const user = models.user;
const com_org = models.com_org;


module.exports = function(app, connectionPool) {

    app.get('/happyday/hdmain', function(req, res, next) {

        /* session 없을 땐 로그인 화면으로 */
        if (!req.session.user_name) {
            req.session.returnTo = '/happyday/hdmain';
            //req.session.returnTo = req.path;
            res.redirect('/');

        }
        console.log("session : " + req.session.user_name + " / " + req.session.emp_num);
                // happyday_user_hst.belongsTo(happyday_master, {foreignKey: 'happyday_id', targetKey: 'happyday_id'})
        
        var data = {};
        
        /* 
         * source model (happyday_master) ----> target model(user) 
         * happyday_master 에 reg_user_id 라는 관계 정보가 있음.
         * source model에 관계정보가 있으면 belongsTo
         * target model에 관계정보가 있으면 hasOne
         */
        happyday_master.belongsTo(user, {foreignKey: 'reg_user_id'});
        // user.hasOne(happyday_master, {foreignKey: 'reg_user_id', targetKey: 'reg_user_id'});
        
        user.belongsTo(com_org, {as: 'team', foreignKey: 'team_id'});
        user.belongsTo(com_org, {as: 'sm', foreignKey: 'sm_id'});
        
        findHappydayMaster().then(master_info => {
            findHappydayUserCount().then(user_count => {
                // 각 해피데이마다 참가자수 계산
                for(var i in master_info) {
                    for(var j in user_count) {
                        if(master_info[i].happyday_id == user_count[j].happyday_id) {
                            master_info[i].cur_parti = user_count[j].cur_parti;
                            break;
                        }
                    }
                }
                
                res.render('happyday/hdmain', { data: master_info, session: req.session });
            })
        }).catch(err => {
            console.log("\n*** ERROR : " + err);
            res.redirect('/');
        });
    });


    app.post('/showparticipants', function(req, res, next) {
         connectionPool.getConnection(function(err, connection) {
            connection.query(' select u.user_name, u.user_img,  (select org_nm from com_org where org_id = u.sm_id) as sm_name from happyday_user_hst hp, user u where u.id = hp.user_id and hp.state="y" and hp.happyday_id=?;  ', [req.body.happyday_id], function(error, rows) {
                if(error) {
                    connection.release();
                    throw error;
                }else {
                    if(rows.length > 0) {
                        var peoplelist='';  
                        for(var i=0; i<rows.length; i++){
                            peoplelist+="<div class='four wide column'><img class='ui small circular image' src='"+rows[i].user_img+"' style='width:150px  !important; height:150px !important; '><h6 class='content' style='text-align:center'>"+rows[i].user_name +"<br>("+ rows[i].sm_name+")</h5></div>";
                        }
 
                        res.send({peoplelist : peoplelist, session : req.session});
                        connection.release();
                    }else {

                    }    
                }
            });
        });
    });
    
    
    /*************************************************************************
     * BELOW FUNCTIONS ARE QUERY MODULES
     *************************************************************************/
     
    function findHappydayMaster() {
        /* 
         * source model (happyday_master) ----> target model(user) 
         * happyday_master 에 reg_user_id 라는 관계 정보가 있음.
         * source model에 관계정보가 있으면 belongsTo
         * target model에 관계정보가 있으면 hasOne
        
         * has~함수와 belongsTo~ 함수를 언제 사용하는가?
         *  쿼리를 시작하는 모델이 source, 쿼리 내부에 include된 모델이 target
         *      -> vote_master (source), vote_detail (target)
         *  관계를 정의하는 정보가 source에 있으면 belongsTo~ 함수를 사용, target에 있으면 has~ 함수를 사용
         *      -> target인 vote_detail의 vote_id가 vote_master와의 관계를 정의하는 정보이므로 hasMany 사용
         */
        happyday_master.belongsTo(user, {foreignKey: 'reg_user_id'});
        // user.hasOne(happyday_master, {foreignKey: 'reg_user_id', targetKey: 'reg_user_id'});
        
        user.belongsTo(com_org, {as: 'team', foreignKey: 'team_id'});
        user.belongsTo(com_org, {as: 'sm', foreignKey: 'sm_id'});
        
        return happyday_master.findAll({
            raw: true,
            attributes:[
                'happyday_id', 'happyday_name', 'state', 'place_name', 'reg_user_id'
                , 'req_point', 'img_url', 'num_participants'
                , [models.sequelize.fn('date_format', models.Sequelize.col('happyday_master.reg_dtm'), '%Y-%m-%d'), 'reg_dtm']
                , [models.sequelize.fn('date_format', models.Sequelize.col('happyday_master.happyday_dt'), '%m월%d일'), 'happyday_date']
                , [models.sequelize.fn('substr', '일월화수목금토', models.sequelize.fn('dayofweek', models.Sequelize.col('happyday_master.happyday_dt')), 1), 'week']
                , [models.sequelize.fn('date_format', models.Sequelize.col('happyday_master.happyday_dt'), '%H:%i'), 'happy_time']
                , [models.sequelize.fn('datediff', models.Sequelize.col('happyday_master.dday_dt'), models.sequelize.fn('CURDATE')), 'dday']
                , [models.Sequelize.col('user.user_name'), 'user_name']
                , [models.Sequelize.col('user.user_img'), 'user_img']
                , [models.Sequelize.col('user.team.org_nm'), 'team_name']
                , [models.Sequelize.col('user.sm.org_nm'), 'sm_name']
            ],  
            include: [{
                model: user,
                attributes:[
                ],
                include: [
                    {
                        model: com_org,
                        as: 'team',
                        attributes: [
                        ]
                    },
                    {
                        model: com_org,
                        as: 'sm',
                        attributes: [
                        ]
                    }
                ]
            }],
            where: {
                state: { $notIn: ['N'] }
            },
            order: [ ['reg_dtm', 'DESC'] ]
        }).then(result => {
            return result;
        });
    }
    
    function findHappydayUserCount() {
        happyday_master.hasMany(happyday_user_hst, {as: 'happyday_user_hst', foreignKey: 'happyday_id', targetKey: 'happyday_id'});
            
        return happyday_master.findAll({
            raw: true,
            attributes:[
                'happyday_id'
                , [models.sequelize.fn('count', models.sequelize.col('happyday_user_hst.user_id')), 'cur_parti']
            ],
            include: [
                {
                    model: happyday_user_hst,
                    as: 'happyday_user_hst',
                    where: {
                        state: { $notIn:['N'] }
                    },
                    attributes: []
                }
            ],
            where: {
                state: { $notIn:['N'] }
            }
            ,
            group: ['happyday_id']
        }).then(result => {
            return result;
        });
    }


}