var models = require('../../models');
var datetime = require('node-datetime');

module.exports = function common() {
    this.setMileage = function(req, connection) {
        var path = req.path;
        console.log('req path : ' + path);
             
        connection.query('select * from com_mileage' +
                         ' where route_path = ?;', path, function(error, rows) {
            
            if(error) {
                return new Error("Error in setMileage : " + error);
            }else {
                if(rows.length > 0) {
                    var mileage = rows[0].mileage;
                    var type = rows[0].use_type;
                    
                    if(type=='D') mileage *= -1;
                    
                    console.log('mileage / type : ' + mileage + ' / ' + type);
                    
                    connection.query('update user' +
                                     '   set mileage = mileage +  convert(?, signed)' + 
                                     ' where id = ?;',[mileage, req.session.user_id], function(error, user) {
                        if(error) {
                            return new Error("Error of set User Mileage : " + error);
                        }else { 
                            return;
                        }
                    });
                }else {
                    return;
                }
            }
        });
    }
    
    this.sendMail = function(maildata) {
        var nodemailer = require('nodemailer');
        var sgTransport = require('nodemailer-sendgrid-transport');
        var hbs = require('nodemailer-express-handlebars');
        
        // set handlebars
        var hbs_options = {
            viewEngine: {
                extname: '.hbs',
                layoutsDir: 'views/maillayouts/',
                defaultLayout : 'template',
                partialsDir : 'views/maillayouts/partials'
            },
            viewPath: 'views/maillayouts/',
            extName: '.hbs'
        };
        
        // create reusable transporter object using the default SMTP transport
        var smtp_options = {
            auth: {
                api_key: process.env.SENDGRID_API_KEY
            }
        };
        
        var mailer = nodemailer.createTransport(sgTransport(smtp_options));

        // mail형식의 compiler로 handlebars를 사용하도록 설정        
        mailer.use('compile', hbs(hbs_options));
          
        // send mail
        mailer.sendMail(setMailOptions(maildata), function(err, res) {
            if (err) { 
                console.log(err) 
            }else {
                console.log('Message sent');
            }
        });
    }
    
    function setMailOptions(maildata) {
        /* set mail options
           from - 송신메일주소
           to - 수신메일주소
           subject - 메일제목
           template - 템플릿이름(views/maillayouts/내의 hbs파일이름만)
           context - 템플릿 내의 변수
        */
        var mailOptions = {};
        
        mailOptions.from = '2bhappymanager@gmail.com';
        
        switch (maildata.type) {
            case 'HDREG':
                const day = maildata.starthappyday;
                
                mailOptions.to = "ljw82@sk.com";
                mailOptions.subject = "[NEW HAPPYDAY] " + maildata.happyday_name;
                mailOptions.template = "reghappyday";
                mailOptions.context = {
                    user_name: maildata.user_name,
                    happyday_dt: day.substring(0,4)+"/"+day.substring(4,6)+"/"+day.substring(6,8),
                    contents: maildata.happyday_contents,
                    req_point: maildata.req_point+"P",
                    place_name: maildata.place_name        
                };
                break;
                
            case 'HDCANCEL':
                var userList = maildata.userList;
                var emails = "";
                for(var i=0; i<userList.length; i++) {
                    emails += userList[i].email;
                    emails += ";";
                }
                mailOptions.to = emails;
                mailOptions.subject = "[CANCEL HAPPYDAY] " + maildata.happyday_name;
                mailOptions.template = "delhappyday";
                mailOptions.context = {
                    happyday_name: maildata.happyday_name,
                };
                break;
                
            case 'VOTEREG':
                const deadline = maildata.vote_deadline;
                
                mailOptions.to = "ljw82@sk.com";
                mailOptions.subject = "[NEW VOTE] " + maildata.vote_name;
                mailOptions.template = "regvote";
                mailOptions.context = {
                    user_name: maildata.user_name,
                    vote_deadline: deadline.substring(0,4)+"/"+deadline.substring(4,6)+"/"+deadline.substring(6,8),
                    vote_contents: maildata.vote_contents,
                    parti_org_id: maildata.parti_org_id
                };
                
                break;
            
            default:
                // code
        }
        
        return mailOptions;
    }
    
    
    /*****************************************************************************************
     * 이미지 업로드 method
     * local에 있는 file이 업로드 성공했을때 호출됨
     * Parameter 설명
     *  imageUrl(imgur상에 올라간 이미지 경로)
     *  deleteHash(차후 이미지 삭제를 위한 hash value)
     *  source(이미지가 올라온 화면 - 공통 활용 위함)
     *  user_id(업로드 유저ID)
     *  isDisplaying - N(모든 이미지는 일차적으로 서버에 모두 업로드 되므로 최종 summit때 해당 값을 Y로 update -> 사용, 미사용 이미지 구분)
     *****************************************************************************************/
    
    this.insertImage = function(req, connection) {
        var path = req.path;
        console.log('req path : ' + path);
        connection.query( 'insert into com_img values(?,?,?,?,sysdate(),?);',[req.body.imageUrl, req.body.deleteHash, req.body.source, req.session.user_id, 'N'],function(error, result){
            if(error){
                console.log('error msg = '+ error);
            }else{
                console.log('success' + result);
                return result;
            }
        }

        )

    }
    
    /*****************************************************************************************
     * 이미지 삭제 method
     * 공통으로 이미지 삭제에 활용
     * 해당 method가 호출되는 시점 -> 이미지가 변경되어 기존 이미지를 서버에서 삭제해야 하는 경우
     * Parameter 설명
     *  imageUrl(imgur상에 올라간 이미지 경로)
     *****************************************************************************************/
    this.deleteImage = function(req, connection) {
        console.log('common.js 안의 deleteImage 호출 imageurl = '+req.body.beforeImageUrl);
        // select deletehash from com_img where imageurl=?;
        connection.query('select * from com_img where imageurl= ?;', [req.body.beforeImageUrl], function(error, rows) {
            console.log("bbb");
                if(error) 
                {
                    console.log('쿼리에러');
                    return new Error("Error in deleteImage : " + error);
                }
                else 
                {
                    console.log('에러는 아님 ');
                    if(rows.length > 0) 
                    {
                        console.log('deletehash존재 : '+rows[0].deletehash );
                        //deletehash가 있으면..  삭제api호출
                        var deleteHash = rows[0].deletehash;
                        var xmlHttpRequest = new XMLHttpRequest();
                        xmlHttpRequest.open('POST', 'https://api.imgur.com/3/image/'+deleteHash, true); //연결
                        xmlHttpRequest.setRequestHeader("Authorization", "Client-ID 285a540d6ec9798"); //client_id 설정
                        xmlHttpRequest.onreadystatechange = function () {
                       
                        if (xmlHttpRequest.readyState == 4) {
                            if (xmlHttpRequest.status == 200) { //성공값
                            var result = JSON.parse(xmlHttpRequest.responseText);//결과값 수신
                             console.log('호출 후 result 값 : '+result);
                            }
                        // }};
                        }};
                        return true;
                        
                    }else {
                        return false;
                    }
                }
            
        });
        console.log("aaa");
     }
     
    
    /*****************************************************************************************
     * 이미지 사이트 내 표시 구분을 위한 Method
     * 공통으로 이미지 업로드 처리 후 활용
     * 해당 method가 호출되는 시점 -> 이미지가 변경되어 업로드된 이미지가 차후 노출될 경우
     * Parameter 설명
     *  imageUrl(imgur상에 올라간 이미지 경로)
     *****************************************************************************************/ 
    this.displayImage = function(req, connection) {
        var path = req.path;
        console.log('req path : ' + path);
        connection.query( 'update com_img set isDisplaying = ? where imageurl = ?;',['Y', req.body.imageurl],function(error, result){
            if(error){
                console.log('error msg = '+ error);
            }else{
                console.log('success' + result);
                return result;
            }
        }

        )

    }
}
// var common = {};
// common.setMileage = setMileage;
// module.exports = common;


