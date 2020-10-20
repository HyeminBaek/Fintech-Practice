const express = require('express');
const { url } = require('inspector');
const app = express()
const path = require("path");
const request = require('request');
var mysql      = require('mysql');
var jwt = require('jsonwebtoken');
var tokenKey = "WER34S!#$@#%12!ADF";
var auth = require('./lib/auth');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'root',
  database : 'fintech'
});
 
connection.connect();


app.set("views",__dirname+"/views");//ejs 디렉토리설정
app.set("view engine","ejs");//ejs 사용을 위한 뷰 엔진 설정

app.use(express.json()); // json 타입의 데이터를 받기위한 설정
app.use(express.urlencoded({extended:false}));

app.use(express.static(path.join(__dirname,"public")));
app.get('/', function (req, res) {
  res.send('Hello World')
})
app.get('/signup',function(req,res){
  res.render("signup");
});
app.get("/login",function(req,res){
  res.render("login");
});
app.get("/main", function(req,res){
  res.render("main");
});
app.get("/balance",function(req,res){
  res.render("balance");
});
app.get("/qrcode",function(req,res){
  res.render("qrcode");
});
app.get("/qrreader",function(req,res){
  res.render("qrreader");
});
app.get('/authText',auth,function(req,res){
  res.json("접근 성공");
});
app.get('/authResult',function(req,res){
  var authCode = req.query.code;
  console.log(authCode);

  var option = {
    method: "POST",
    url: "https://testapi.openbanking.or.kr/oauth/2.0/token",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    //form 형태는 form / 쿼리스트링 형태는 qs / json 형태는 json ***
    form: {
      code:authCode,
      client_id:"SzkqGZDrjpHGcvOqId0JArGI0BxSIX6DEPRELNPE",
      client_secret:"VFsCmQtMYUjxRseGJuX3I5zG2Yop4CiOtbIlqsvb",
      redirect_uri:"http://localhost:3000/authResult",
      grant_type:"authorization_code"
    //#자기 키로 시크릿 변경
    },
  };
  request(option,function(error,response,body){
    var accessRequestResult = JSON.parse(body);
    console.log(accessRequestResult);
    res.render("resultChild", { data: accessRequestResult });
  });
});
app.post('/signup',function(req,res){
  var userName = req.body.userName;
  var userEmail = req.body.userEmail;
  var userPassword = req.body.userPassword;
  var userAccessToken = req.body.userAccessToken;
  var userRefreshToken = req.body.userRefreshToken;
  var userSeqNo = req.body.userSeqNo;
  console.log(userName,userEmail,userPassword);
  connection.query("INSERT INTO `user`(`name`,`email`,`password`, `accesstoken`,`refreshtoken`,`userseqno`) VALUES(?,?,?,?,?,?);",
  [
      userName,
      userEmail,
      userPassword,
      userAccessToken,
      userRefreshToken,
      userSeqNo,
  ],
  function (error, results, fields) {
    if (error) throw error;
    else {
        res.json(1);
      }
  });
});
app.post("/login",function(req,res){
  var userEmail = req.body.userEmail;
  var userPassword = req.body.userPassword;
  console.log(userEmail,userPassword);

  connection.query("SELECT * FROM user WHERE email = ?",
  [
    userEmail,

  ],
  function (error, results, fields) {
    if (error) throw error;
    else {
      if(results.length == 0){
        res.json(2);
      }
      else{
        var storedPassword = results[0].password;
        if(storedPassword == userPassword){
          jwt.sign(
            {
              userId: results[0].id,
              userEmail: results[0].email,
            },
            tokenKey,
            {
              expiresIn: "1h",
              issuer: "fintech.admin",
              subject: "user.login.info",//어떤 목적으로 토큰을 만들었는지
            },
            function (err, token) {
              console.log("로그인 성공", token);
              res.json(token);
            }
          );
        }
        else{
          res.json("로그인 실패");
        }
      }
      }
  });
});
app.post("/list",auth,function(req,res){
var userId = req.decoded.userId;
connection.query("SELECT * FROM user WHERE id =?",[userId],function(
  error,results){
    if(error) throw error;
    else{
      var option = {
        method: "GET",
        url: "https://testapi.openbanking.or.kr/v2.0/user/me",
        headers: {
          Authorization:
          "Bearer "+ results[0].accesstoken,
        },
        qs: {
          user_seq_no: results[0].userseqno,
      
        },
      };
        request(option,function(err,response,body){
          var resResult = JSON.parse(body);
          res.json(resResult);
        });
    }
  }
)

});
app.post("/balance",auth,function(req,res){
  var userId = req.decoded.userId;
  //사용자 정보를 바탕으로 request 요청 만들기 https://testapi.or.kr/...fin_num
  var countnum = Math.floor(Math.random()*1000000000)+1;
  var transId="T991659510U"+countnum;//bank_tran_id 랜덤생성을 위함
  var finusenum =req.body.fin_use_num;
connection.query("SELECT * FROM user WHERE id =?",[userId],function(
  error,results){
    if(error) throw error;
    else{
      var option = {
        method: "GET",
        url: "https://testapi.openbanking.or.kr/v2.0/account/balance/fin_num",
        headers: {
          Authorization:
          "Bearer "+ results[0].accesstoken,
        },
        qs: {
          //user_seq_no: results[0].userseqno,
          bank_tran_id:transId,
          fintech_use_num:finusenum,
          tran_dtime:"20200923153105",
        },
      };
        request(option,function(err,response,body){
          var resResult = JSON.parse(body);
          res.json(resResult);
        });
    }
  }
)
app.post("/transactionlist",auth,function(req,res){ //거래내역조회
  var userId = req.decoded.userId;
  var countnum = Math.floor(Math.random()*1000000000)+1;
  var transId="T991659510U"+countnum;//bank_tran_id 랜덤생성을 위함
  var finusenum =req.body.fin_use_num;
connection.query("SELECT * FROM user WHERE id =?",[userId],function(
  error,results){
    if(error) throw error;
    else{
      var option = {
        method: "GET",
        url: "https://testapi.openbanking.or.kr/v2.0/account/balance/fin_num",
        headers: {
          Authorization:
          "Bearer "+ results[0].accesstoken,
        },
        qs: {
          //user_seq_no: results[0].userseqno,
          bank_tran_id:transId,
          fintech_use_num:finusenum,
          tran_dtime:"20200923153105",
          inquiry_type:'A',
          inquiry_base:'D',
          from_date:"20190101",
          to_date:"20190102",
          sort_order:"D",
          
        },
      };
        request(option,function(err,response,body){
          var resResult = JSON.parse(body);
          console.log(resResult);
          res.json(resResult);
        });
    }
  }
)
});
});
app.post('/withdraw', auth, function(req,res){
  var userId = req.decoded.userId;
  var amount = req.body.amount;
  var fin_use_num = req.body.fin_use_num;
  var to_fin_use_num = req.body.to_fin_use_num;
  var countnum = Math.floor(Math.random()*1000000000)+1;
  var transId="T991659510U"+countnum;//bank_tran_id 랜덤생성을 위함
  console.log( userId,fin_use_num,to_fin_use_num,amount);
connection.query("SELECT * FROM user WHERE id =?",[userId],function(
  error,results){
    if(error) throw error;
    else{
      var option = {
        method: "POST",
        url: "https://testapi.openbanking.or.kr/v2.0/transfer/withdraw/fin_num",
        headers: {
          Authorization:
          "Bearer "+ results[0].accesstoken,
          "Content_Type":'application/json'
        },
        json: {
          "bank_tran_id":transId,
          "cntr_account_type":"N",
          "cntr_account_num":"1229346736",
          "dps_print_content":"쇼핑몰환불",
          "fintech_use_num":fin_use_num,
          "wd_print_content":"오픈뱅킹출금",
          "tran_amt":amount,
          "tran_dtime":"20200923153339",
          "req_client_name":"백혜민",
          "req_client_fintech_use_num":fin_use_num,
          "req_client_num":"1100763464",
          "transfer_purpose":"ST",
          "recv_client_name":"백혜민",
          "recv_client_bank_code":"097",
          "recv_client_account_num":"1229346736"},
      };
        request(option,function(err,response,body){
          console.log(body);
          //입금기능
        });
    }
  }
)
});
app.listen(3000)
