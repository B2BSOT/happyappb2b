

module.exports = function(app) {

    app.get('/teamschedule/calendar', function(req, res, next) {
        
        /* session 없을 땐 로그인 화면으로 */
        if(!req.session.user_name) {
            res.redirect('/');
        }
        
        res.render('teamschedule/calendar', {data : "팀일정", session : req.session});
    });
}