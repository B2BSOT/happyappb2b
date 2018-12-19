var models = require('../../models');
var datetime = require('node-datetime');
var vote_master = models.vote_master;
var vote_detail = models.vote_detail;
var com_org = models.com_org;
var user = models.user;

module.exports = function(app) {

    app.get('/vote/votemain', function(req, res, next) {
        
        /* session 없을 땐 로그인 화면으로 */
        if(!req.session.user_name) {
            req.session.returnTo = '/vote/votemain';
            //req.session.returnTo = req.path;
            res.redirect('/');
        }

        var data = {}; 

        // vote_master.update(
        //     {
        //         state : 'C'
        //     }
        //     ,{ 
        //         // lt: '<', lte: '<=', gt: '>', gte: '>='     
        //         where : { 'deadline' : {$lt : '20170831000000' } } 
        //         //where : { 'deadline' : {$gt : new Date(new Date() - 24 * 60 * 60 * 1000) } } 
        //         //where : { 'deadline' : {$gt : new Date().toString(14)} }             
        //         //[models.Sequelize.fn('date_format',models.Sequelize.fn('now'), '%Y%m%d%H%i%s')]
        //         ,returning: true
        //     }
        // ).then(update_info => {
        //     return update_info;
        // });
        
        /******************************************************************************************************
         * 1) table user를 reg_user_id, session.user_id에 대해서 model을 2번 정의
         * vote_detail.user_id = req.session.user_id 할때, 관계정의 M : N 어렵다...
         * 1-1) com_org.org_nm 은 reg_user_id 에 inner include(join)
         * 1-2) fn('count'~) 는 session.user_id 에 inner include(join)
         *  
         * cnt만 하려면 detail이랑 user(test) 조인 필요가 없다... session만 하면되서
         * sm_id랑 team_id 걸어주려면 detail랑 user(test)테이블 걸어줘야 한다 !!!
         * -------> user테이블 별로 쿼리 분리할 예정 
         *
         *  select -- 투표 정보
         *         a.vote_id
         *        ,a.subject
         *		  ,a.reg_dtm
         *		  ,a.deadline
         *		  ,a.state
         *		  ,date_format(sysdate,  "%Y%m%d%H%i%s") as systime
         *		  ,date_format(sysdate,  "%Y%m%d") as sysdate
         *		  ,date_format(left(a.reg_dtm,8), "%m월 %d일") as reg_date
         *		  ,substr( _UTF8"일월화수목금토", DAYOFWEEK(left(a.reg_dtm,8)), 1) as reg_week
         *		  ,date_format(a.reg_dtm,  "%H:%i") as reg_time
         *		  ,date_format(left(a.reg_dtm,8), "%m월 %d일") as dday_date
         *		  ,substr( _UTF8"일월화수목금토", DAYOFWEEK(left(a.reg_dtm,8)), 1) as dday_week
         *		  ,date_format(a.reg_dtm,  "%H:%i") as dday_time
         *		  ,substr(a.comment,0,15) as comment
         *        -- 등록자 정보 
         *        ,c.id   
         *		  ,c.user_name
         *		  ,c.user_img
         *        ,d.org_nm
         *        -- 0:투표안함 1:투표함(.ejs에서 처리)
         *		  ,(select count(*) from vote_detail d where d.vote_id = a.vote_id and d.user_id = b.id) cnt 
         *  from  vote_master a
         *        ,user b 
         *        ,user c
         *        ,com_org d
         *  where 1=1
         *  and   a.parti_org_id in(b.team_id, b.sm_id) 
         *  and   b.id = '5' -- req.session.user_id
         *  and   c.id = a.reg_user_id
         *  and   d.org_id = c.sm_id
         *  order by state asc, deadline asc, reg_dtm desc 
         *  ;
         *
         *******************************************************************************************************/        
        
        findVoteMaster(req).then(result => {
            data.master_info = result;
            
            /* 각 투표마다 로그인한 유저가 투표를 했는지 조회 */
            return countVoteDetailByUserId(req);
        
            
        }).then(result => {
            console.log("\n\ncount vote : " + JSON.stringify(result));
            
            for(var i in data.master_info) {
                var isVoted = false;
                
                for(var j in result) {
                    if(data.master_info[i].vote_id == result[j].vote_id) {
                        isVoted = true;
                        break;
                    }
                }
                
                if(isVoted) {
                    data.master_info[i].voted = "Y";
                }else {
                    data.master_info[i].voted = "N";
                }
            }
            
            console.log(data.master_info[0]);
            
            res.render('vote/votemain', {data : data, session : req.session});
            
        }).catch(error => {
            console.log(error);
        });
    });
    
    
    /****************************************************************************************************
     * QUERY MODULES
     * **************************************************************************************************/
    
    function findVoteMaster(req) {
        /* user : vote_master - 1 : M 관계 설정 셋팅(등록자 정보 및 등록 투표 정보 조회) */
        vote_master.belongsTo(user, {as : 'user' , foreignKey: 'reg_user_id', targetKey: 'id'});
        user.hasMany(vote_master, {as: 'vote_master', foreignKey: 'id'});
        
        /* com_org : user - 1 : M */
        user.belongsTo(com_org, {foreignKey: 'sm_id', targetKey: 'org_id'});
        com_org.hasMany(user, {as: 'user', foreignKey: 'org_id'});        
        
        return vote_master.findAll({
            raw : true,
            attributes : [
                'vote_id', 'parti_org_id', 'reg_user_id', 'reg_dtm', 'deadline', 'state'
                , [models.Sequelize.fn('left', models.Sequelize.col('subject'),15), 'subject']
                , [models.Sequelize.fn('date_format',models.Sequelize.fn('now'), '%Y%m%d%H%i%s'),'systime']
                , [models.Sequelize.fn('date_format',models.Sequelize.fn('now'), '%Y%m%d'),'sysdate']
                , [models.Sequelize.fn('date_format',models.Sequelize.fn('left', models.Sequelize.col('reg_dtm'), 8), '%m월 %d일'), 'reg_date']
                , [models.Sequelize.fn('substr',"일월화수목금토",models.Sequelize.fn('dayofweek',models.Sequelize.fn('left', models.Sequelize.col('reg_dtm'), 8)) , 1), 'reg_week']
                , [models.Sequelize.fn('date_format', models.Sequelize.col('reg_dtm'), '%H:%i'), 'reg_time']
                , [models.Sequelize.fn('left', models.Sequelize.col('deadline'),8), 'ddate']
                , [models.Sequelize.fn('date_format',models.Sequelize.fn('left', models.Sequelize.col('deadline'), 8), '%m월 %d일'), 'dday_date']
                , [models.Sequelize.fn('substr',"일월화수목금토",models.Sequelize.fn('dayofweek',models.Sequelize.fn('left', models.Sequelize.col('deadline'), 8)) , 1), 'dday_week']
                , [models.Sequelize.fn('date_format', models.Sequelize.col('deadline'), '%H:%i'), 'dday_time']
                , [models.Sequelize.fn('left', models.Sequelize.col('comment'),15), 'comment']
                , [models.Sequelize.col('user.id'), 'id']
                , [models.Sequelize.col('user.user_name'), 'user_name']
                , [models.Sequelize.col('user.user_img'), 'user_img']
                , [models.Sequelize.col('user.sm_id'), 'sm_id']
                , [models.Sequelize.col('user.com_org.org_nm'), 'org_nm']
                , [models.sequelize.fn('datediff', models.Sequelize.fn('left', models.Sequelize.col('deadline'),8), models.Sequelize.fn('date_format',models.Sequelize.fn('now'), '%Y%m%d')), 'dday']
            ], // 실제 결과 컬럼
            include : [ 
                {
                    model: user,
                    as : 'user',
                    where : { id : {$col : 'vote_master.reg_user_id' } },
                    attributes : [],
                    include : [{ model:com_org, as : 'com_org',where: {org_id : {$col : 'user.sm_id'}}}]
                }
            ],//include
            where : {
                parti_org_id : { 
                    $in : [req.session.team_id, req.session.sm_id]  // so투표가능여부
                },
                state : {
                    $notIn : ['N']
                }
            },
            order : [ ['state', 'desc'] , ['reg_dtm', 'desc'], ['deadline', 'asc'] ]
        }).then(master_info => {
            return master_info;
        });
    }
    
    function countVoteDetailByUserId(req) {
        return vote_detail.findAll({
            raw : true,
            attributes : [
                [models.sequelize.fn('max', models.Sequelize.col('vote_id')), 'vote_id']
                , [models.sequelize.fn('count', 'user_id'), 'cnt']
            ]
            ,where :  { user_id: req.session.user_id } 
            ,group : [ 'vote_id' ]
        }).then(count_info => {
            return count_info;
        });
    }
}
