var models = require('../../models');
var datetime = require('node-datetime');

// Sequalize Model 전역변수
const vote_master = models.vote_master;
const vote_detail = models.vote_detail;
const vote_items = models.vote_items;
const user = models.user;

var TEST_VOTE_ID = 1;
var TEST_PARTI_ORG_ID = 10001;

module.exports = function(app) {

    app.get('/vote/votedetail/:id', verifyVote, findDetailInfo, (req, res, next) => {

        // console.log(req.params.id);
        /**********************************************************************************************************
         *  0. 이전 vote main화면에서 vote_id, parti_org_id 를 넘겨준다고 가정
         *  1. 투표검증
         *     - verifyVote
         *       1.1 session의 user_id가 해당투표 가능조직인지 다시 체크(url주소를 쳐서 들어오는 것을 방지)
         *       1.2 vote master가 존재하는지 체크
         *  2. 투표 상세 정보 조회
         *     - findDetailInfo
         *       2.1 vote_master의 정보 조회
         *       2.2 현재 USER가 투표한 아이템 리스트 조회
         *       2.3 현재 투표한 총 투표수 조회
         *       2.4 투표 아이템 정보 및 각 아이템의 투표 수 조회,
         *       2.5 각 아이템에 session user가 투표했는지 체크 - setMyVoted
         *********************************************************************************************************/
        var data = {};

        /* 2.5 각 아이템에 session user가 투표했는지 체크 */
        data.verifyVote = req.verifyVote;
        data.detail_info = setMyVoted(req.detail_info, req.myList);
        data.master_info = req.master_info;
        data.vote_total_cnt = req.vote_total_cnt;


        res.render('vote/votedetail', {data : data, session : req.session});



    });

    app.post('/checkItem', verifyVote, modifyCheckItem, findDetailInfo, function(req, res, next) {
        var data = {};

        /* 2.5 각 아이템에 session user가 투표했는지 체크 */
        data.verifyVote = req.verifyVote;
        data.detail_info = setMyVoted(req.detail_info, req.myList);
        data.master_info = req.master_info;
        data.vote_total_cnt = req.vote_total_cnt;

        res.json({type: req.checkType, status: 200, data: data});

    });

    /** CheckItem Middleware */
    function modifyCheckItem(req, res, next) {
        const CHECK_DELETE = "delete";
        const CHECK_CREATE = "create";

        var dt = datetime.create();
        var formattedDate = dt.format('YmdHMS') // YYYYMMDDHH24MISS

        /*****************************************************************************************
         * 투표 체크를 이미 한 아이템에 했는지 여부와
         * 해당 투표가 다중투표가 가능한지 여부에 따라 로직을 달리한다.
         *
         * ## 화면에서 체크된 아이템이 투표를 했는지 여부를 알려주는 값을 넘겨준다고 가정
         *
         * 1. 투표 체크를 이미 한 아이템인 경우
         *    1. 이미 투표한 정보는 delete
         *
         * 2. 투표 체크를 하지 않은 아이템인 경우
         *   2-1. 투표 종류가 1인 1선택인 경우
         *      1. 해당 user_id로 투표한 정보는 delete
         *      2. 새로 투표한 아이템은 create
         *
         *   2-2. 투표가 1인 다중 선택인 경우
         *      1. 새로 투표한 아이템 create
         * *************************************************************************************/

        var isChecked = req.body.isChecked; // 화면에서 이미 체크된 아이템에 투표했는지 여부
        var item_id = req.body.item_id; // 투표한 item id
        var multi_yn = req.body.multi_yn; // 다중 투표
        var vote_id = req.body.vote_id; // 투표 id
        var user_id = req.session.user_id; // 투표한 user id

        /* 1. 투표체크를 이미 한 아이템인 경우
                - 이미 투표한 정보는 delete
        */
        if(isChecked == "Y") {
            vote_detail.destroy({
                where: {
                    'vote_id': vote_id,
                    'item_id': item_id,
                    'user_id': user_id
                }
            }).then(result => {
                req.checkType = CHECK_DELETE;
                next();

            }).catch(err => {
                console.log(err);
                res.json({type: 'error', status: 400, err: err});
            });
        }
        /* 2. 투표 체크를 하지 않은 아이템인 경우 */
        else {
            /* 2-1. 투표 종류가 1인 1선택인 경우 */
            if(multi_yn == "N") {
                /* 1. 해당 user_id로 투표한 정보는 delete */
                vote_detail.destroy({
                    where: {
                        'vote_id': vote_id,
                        'user_id': user_id
                    }
                }).then(result => {
                    /* 2-1-2 통합. 새로 투표한 아이템은 create */
                    vote_detail.create({
                        'vote_id': vote_id,
                        'item_id': item_id,
                        'user_id': user_id,
                        'reg_dtm': formattedDate
                    }).then(result => {
                        req.checkType = CHECK_CREATE;
                        next(); // NEXT middleware
                    });
                }).catch(err => {
                    console.log(err);
                    res.json({type: 'error', status: 400, err: err});
                });
            }
            /* 2-2. 투표가 1인 다중 선택인 경우 */
            else {
                /* TODO: 다중 투표의 갯수 제한이 있을 경우 로직 필요 */

                /* 2-1-1. 새로 투표한 아이템은 create */
                vote_detail.create({
                    'vote_id': vote_id,
                    'item_id': item_id,
                    'user_id': user_id,
                    'reg_dtm': formattedDate
                }).then(result => {
                    req.checkType = CHECK_CREATE;
                    next(); // NEXT middleware

                }).catch(err => {
                    console.log(err);
                    res.json({type: 'error', status: 400, err: err});
                });
            }


        }
    }

    /** Vote Verification Middleware */
    function verifyVote(req, res, next) {
        /* session 없을 땐 로그인 화면으로 */
        if(!req.session.user_name) {
            //로그인 후 리턴을 위함
            req.session.returnTo = 'vote/votedetail/'+req.params.id;
            //req.session.returnTo = req.path;
            res.redirect('/');
        }

        var vote_master = models.vote_master;
        var vote_detail = models.vote_detail;
        var vote_items = models.vote_items;
        var user = models.user;
        var com_org = models.com_org;

        var data = {};

        var vote_id=1;

        if(req.body.vote_id == null){
            vote_id = req.params.id;
        }
        else{
            vote_id = req.body.vote_id;
        }





        /*
         *  0. 이전 vote main화면에서 vote_id, parti_org_id 를 넘겨준다고 가정
         *  1. session의 user_id가 해당투표 가능조직인지 다시 체크(url주소를 쳐서 들어오는 것을 방지)
         *  2. user_id로 해당 vote_id에 투표한 정보가 있는지 조회
         *  3. 해당 vote_id로 vote_main, vote_items, vote_detail 조회
         */

        // session의 user_id
        var user_id = req.session.user_id;

        // Sequalize Model 설정
        // var user = models.user;
        // var vote_master = models.vote_master;

        user.count({
            where: {
                'id': user_id,
                $or:[
                    {'team_id': TEST_PARTI_ORG_ID},//req.body.parti_org_id
                    {'sm_id': TEST_PARTI_ORG_ID},//req.body.parti_org_id
                ]
            }
        }).then(c => {
            if(c == 0) {
                var data = {verifyVote: "NotUser"};
                res.render('/vote/votemain', {data: data});
            }

            vote_master.count({
                where : {
                    // vote_id : TEST_VOTE_ID//req.body.vote_id
                    vote_id : vote_id
                }
            }).then(c => {
                if(c == 0) {
                    var data = {verifyVote: "NotExist"};
                    res.render('/vote/votemain', {data: data});
                }
                req.verifyVote = "OK";
                next(); // NEXT middleware
            });
        });
    }

    /** Vote Detail Middleware */
    function findDetailInfo(req, res, next) {

        /* 2.1 vote_master의 정보 조회 */
        findVoteMaster(req).then(result => {
            req.master_info = result;
            /* 2.2 현재 USER가 투표한 아이템 리스트 조회 */
            return findMyVoteList(req);

        }).then(result => {
            req.myList = result;
            /* 2.3 현재 투표한 총 투표수 조회 */
            return findVoteTotalCount(req);

        }).then(result => {
            req.vote_total_cnt = result;
            /* 2.4 투표 아이템 정보 및 각 아이템의 투표 수 조회 */
            return findVoteDetailToItems(req);

        }).then(result => {
            req.detail_info = result;
            next(); // NEXT middleware

        }).catch(function(err) {

            next(err);
        });;
    }

    /* 2.5 각 아이템에 session user가 투표했는지 체크 */
    function setMyVoted(detail_info, myList) {

        for(var i in detail_info) {
            var isVoted = false;

            for(var j in myList) {
                if(detail_info[i].item_id == myList[j].item_id) {
                    isVoted = true;
                    break;
                }
            }

            if(isVoted) {
                detail_info[i].voted = "Y";
            }else {
                detail_info[i].voted = "N";
            }
            // console.log("**RESULT DATA [ "+i+" ] : " + JSON.stringify(detail_info[i]));
        }

        return detail_info;
    }



    app.post('/add_vote_item',findDetailInfo, add_item_query, findDetailInfo, function(req, res, next) {

        var data = {};


            data.detail_info = setMyVoted(req.detail_info, req.myList);
            data.master_info = req.master_info;
            data.vote_total_cnt = req.vote_total_cnt;
            // res.json({type: req.checkType, status: 200, data: data});
            res.json({status: 200, data: data});

    });


    function add_item_query(req, res, next) {

       var user_id = req.session.user_id;
        // console.log(user_id);
        // console.log(req.body.vote_id);
        // console.log(req.body.new_item_id);
        // console.log(req.body.item_name);

        var vote_items = models.vote_items;
        var dt = datetime.create();
        var formattedDate = dt.format('YmdHMS') // YYYYMMDDHH24MISS

        var isAlreadyAddItem = false;

        for(var i in req.detail_info) {

            if(req.detail_info[i].item_name == req.body.item_name) {
                isAlreadyAddItem = true;
                res.json({type: 'error', status: 500});
                break;
            }
        }


        // /* 새로운 투표 아이템 create */
        if(isAlreadyAddItem == false){
            vote_items.create({
                'vote_id': req.body.vote_id,
                'item_id': req.body.new_item_id,
                'item_name': req.body.item_name,
                'reg_user_id': req.session.user_id,
                'reg_dtm': formattedDate
            }).then(result => {
                // req.new_item_list = new_item_list;
                next();

            }).catch(err => {
                console.log(err);
                res.json({type: 'error', status: 400, err: err});
            });
        }

        else{
            next();
        }

    }





    /*************************************************************************
     * BELOW FUNCTIONS ARE QUERY MODULES
     *************************************************************************/

    function findVoteMaster(req) {
        var TEST_VOTE_ID = 1;
        var TEST_PARTI_ORG_ID = 10001;

        var vote_id=1;

        if(req.body.vote_id == null){
            vote_id = req.params.id;
        }
        else{
            vote_id = req.body.vote_id;
        }

        //console.log("findVoteMaster"+vote_id);
        /* 2.1 vote_master의 정보 조회
          vote_master : user - 1 : 1 관계 설정 셋팅
        */

        vote_master.hasOne(user, {foreignKey: 'id', targetKey: 'reg_user_id'});
        vote_master.belongsTo(user, {foreignKey: 'reg_user_id', sourceKey: 'id'});

        /*****************************************************************************************************
         * # find 함수에서 raw: true 옵션
         * - 해당 옵션을 주면 쿼리 결과를 sequalize instance에 담지 않고 일반 데이터(key, value) 형태로 넘겨준다
         *
         * # raw 옵션의 문제점
         * - include를 했을 경우 key값이 inclue한 model 이름이 함께 반환된다.
         *   따라서 attributes 옵션을 이용하여 as구문으로 key값을 변환하는 작업을 거쳐야 한다.
         * ***************************************************************************************************/
        return vote_master.findOne({
            raw: true, // (key, value) 로 result 반환
            attributes : [
                'vote_id', 'subject', 'comment', 'reg_user_id', 'reg_dtm', 'deadline',
                'state', 'parti_org_id', 'multi_yn', 'secret_yn', 'add_item_yn', 'noti_yn',
                [models.Sequelize.col('user.id'), 'id'], // raw옵션으로 user.id가 반환되므로 'id'로 이름 변환
                [models.Sequelize.col('user.user_name'), 'user_name'],
                [models.Sequelize.col('user.user_img'), 'user_img']
            ],
            include: [{
                model: user,
                // where : { id : {$col : 'vote_master.user_id' } }
                attributes: [ //    'id', 'user_name'
                ]
            }],
            where : {
                // vote_id : TEST_VOTE_ID//req.body.vote_id
                vote_id : vote_id
            }
        }).then(master_info => {
            return master_info;
        });
    }

    function findMyVoteList(req) {

         var vote_id=1;

        if(req.body.vote_id == null){
            vote_id = req.params.id;
        }
        else{
            vote_id = req.body.vote_id;
        }

        //console.log("findMyVoteList"+vote_id);
        return vote_detail.findAll({
            raw: true,
            attributes: [
                'item_id',
            ],
            where: {
                // 'vote_id': TEST_VOTE_ID,//req.body.vote_id
                'vote_id': vote_id,
                'user_id': req.session.user_id
            }
        }).then(myList => {
            return myList;
        });
    }

    function findVoteTotalCount(req) {

         var vote_id=1;

        if(req.body.vote_id == null){
            vote_id = req.params.id;
        }
        else{
            vote_id = req.body.vote_id;
        }

        //console.log("findVoteTotalCount"+vote_id);
        return vote_detail.count({
            where : {
                // vote_id : TEST_VOTE_ID//req.body.vote_id
                vote_id : vote_id
            }
        }).then(vote_total_cnt => {
            return vote_total_cnt;
        });
    }

    function findVoteDetailToItems(req) {

        var vote_id=1;

        if(req.body.vote_id == null){
            vote_id = req.params.id;
        }
        else{
            vote_id = req.body.vote_id;
        }
        //console.log("findVoteDetailToItems"+vote_id);

        vote_items.hasMany(vote_detail, {as: 'vote_detail', foreignKey: 'item_id', sourceKey: 'item_id'});
        vote_detail.belongsTo(vote_items, {foreignKey: 'item_id', targetKey: 'item_id'});

        return vote_items.findAll({
            raw : true,
            attributes : [
                'item_id',
                'item_name',
                [ models.Sequelize.fn('count', models.Sequelize.col('vote_detail.user_id')), 'cnt' ]
            ], // 실제 결과 컬럼
            include : [ {
                model: vote_detail,
                as : 'vote_detail',
                where : {
                    // vote_id: TEST_VOTE_ID
                    vote_id: vote_id
                    //item_id : {$col : 'vote_items.item_id' }

                },
                attributes : [],
                required: false // LEFT OUTER JOIN
                }
            ], // INNER JOIN 테이블 설정
            where : {
                // vote_id : TEST_VOTE_ID//req.body.vote_id
                vote_id : vote_id
            }, // 조건절
            group : [ 'item_id', 'item_name' ] // GROUP BY 설정
            // order : [ ['item_id', 'ASC'] ] // ORDER BY 설정

        }).then(detail_info => {
            return detail_info;
        })
    }

    app.post('/delete_vote', function(req, res, next) {

       console.log("vote_id :" + req.body.vote_id);

       vote_master.update(
                {
                    state : 'N'
                 },
                {
                    where: {
                        'vote_id': req.body.vote_id
                    },
                    returning: true
                }
            ).then(result => {
                res.redirect('/vote/votemain/');
                // res.render('/vote/votemain');

            }).catch(err => {
                console.log(err);
                res.json({type: 'error', status: 400, err: err});
            });
    });

    app.post('/vote_current_state', function(req, res, next) {

       console.log("vote_id :" + req.body.vote_id);

        var vote_detail = models.vote_detail;
        var vote_items = models.vote_items;
        var com_org = models.com_org;
        var user = models.user;

        var data2 = {};

        /* vote_detail : vote_items - 1 : M */
        /*  has~함수와 belongsTo~ 함수를 언제 사용하는가?
          *  쿼리를 시작하는 모델이 source, 쿼리 내부에 include된 모델이 target
          *      -> vote_master (source), vote_detail (target)
          *  관계를 정의하는 정보가 source에 있으면 belongsTo~ 함수를 사용, target에 있으면 has~ 함수를 사용
          *      -> target인 vote_detail의 vote_id가 vote_master와의 관계를 정의하는 정보이므로 hasMany 사용
         */
        vote_detail.belongsTo(vote_items, {as : 'vote_items' , foreignKey: 'item_id', targetKey: 'item_id'});

        vote_detail.belongsTo(user, {as: 'user', foreignKey: 'user_id'});

        vote_detail.findAll({
            raw : true,
            attributes : [
                'item_id',
                [models.Sequelize.col('vote_items.item_name'), 'item_name'],
                [models.Sequelize.col('user.user_name'), 'user_name']

            ], // 실제 결과 컬럼
            include : [ {
                model: vote_items,
                as : 'vote_items',
                where : {
                    vote_id: {$col : 'vote_detail.vote_id'}
                    },
                attributes : []
                },
                {
                    model: user,
                    as : 'user',
                    attributes : [],
                    required: true
                }
            ],
            where : {
                 vote_id : req.body.vote_id
            }, // 조건절
            order :  ['vote_items.item_id']
        }).then(state_info => {
            data2.state_info = state_info;

            console.log("****************data***************"+JSON.stringify(data2.state_info));
            res.json({type: req.checkType,status : 200, data2 : data2.state_info});
        })


    });

}

/*******
 * Where에 사용되는 조건 표현식
Project.findAll({
  where: {
    id: {
      $and: {a: 5}           // AND (a = 5)
      $or: [{a: 5}, {a: 6}]  // (a = 5 OR a = 6)
      $gt: 6,                // id > 6
      $gte: 6,               // id >= 6
      $lt: 10,               // id < 10
      $lte: 10,              // id <= 10
      $ne: 20,               // id != 20
      $between: [6, 10],     // BETWEEN 6 AND 10
      $notBetween: [11, 15], // NOT BETWEEN 11 AND 15
      $in: [1, 2],           // IN [1, 2]
      $notIn: [1, 2],        // NOT IN [1, 2]
      $like: '%hat',         // LIKE '%hat'
      $notLike: '%hat'       // NOT LIKE '%hat'
      $iLike: '%hat'         // ILIKE '%hat' (case insensitive)  (PG only)
      $notILike: '%hat'      // NOT ILIKE '%hat'  (PG only)
      $overlap: [1, 2]       // && [1, 2] (PG array overlap operator)
      $contains: [1, 2]      // @> [1, 2] (PG array contains operator)
      $contained: [1, 2]     // <@ [1, 2] (PG array contained by operator)
      $any: [2,3]            // ANY ARRAY[2, 3]::INTEGER (PG only)
    },
    status: {
      $not: false,           // status NOT FALSE
    }
  }
})

// count
Project.count({ where: {'id': {$gt: 25}} }).then(c =>
  console.log("There are " + c + " projects with an id greater than 25.")
})

// order by 표현식
something.findOne({
  order: [
    'name',
    // will return `name`
    'username DESC',
    // will return `username DESC` -- i.e. don't do it!
    ['username', 'DESC'],
    // will return `username` DESC
    sequelize.fn('max', sequelize.col('age')),
    // will return max(`age`)
    [sequelize.fn('max', sequelize.col('age')), 'DESC'],
    // will return max(`age`) DESC
    [sequelize.fn('otherfunction', sequelize.col('col1'), 12, 'lalala'), 'DESC'],
    // will return otherfunction(`col1`, 12, 'lalala') DESC
    [sequelize.fn('otherfunction', sequelize.fn('awesomefunction', sequelize.col('col'))), 'DESC']
    // will return otherfunction(awesomefunction(`col`)) DESC, This nesting is potentially infinite!
  ]
})

************/
