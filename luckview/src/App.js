import './App.css';
import { useRef, useState, useEffect } from "react";
import { LuckyWheel } from '@lucky-canvas/react';
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

function App() {
  const reqUrls = {
    luckUrl: window.location.href + "/goodluck",
    prizesUrl: "/luck/prizes"
  }
  const bkgImgRef = useRef();
  const LuckyRef = useRef();
  const btnImg = "https://img.alicdn.com/imgextra/i3/917298378/O1CN01EstEaX2BlAyhhL9eC_!!917298378.png";
  const luckImg = "https://img.alicdn.com/imgextra/i3/917298378/O1CN01YCfmGB2BlAybPzuS2_!!917298378.png";
  const bjimg = "https://img.alicdn.com/imgextra/i4/917298378/O1CN01Y5N7df2BlAyp3plHl_!!917298378.jpg";
  const wingif = "https://img.alicdn.com/imgextra/i3/917298378/O1CN01xehpw42BlAxlaOqJ3_!!917298378.gif";
  const blocks = [
    {
      padding: '20px',
      imgs: [{
        src: luckImg,
        width: '100%',
        rotate: true
      }]
    }
  ];
  const defaultConfig = {
    speed: 30,
    accelerationTime: 2500,
    decelerationTime: 5000,
  };
  const [prizes, setPrizes] = useState([]);
  const buttons = [
    {
      radius: '50%',
      imgs: [{
        src: btnImg,
        width: '80%',
        top: '-120%'
      }]
    }
  ];
  const mySwal = withReactContent(Swal);
  let prizesStatus = false;
  const luckData = useRef({});
  const swalpadding = "1.25rem";
  const swalbkgcolor = "#ffffffde";
  const errorhandler = (error, icons) => {
    LuckyRef.current.stop();
    if (icons === "info") {
      mySwal.fire({
        padding: swalpadding,
        title: "Sorry",
        text: error,
        background: swalbkgcolor,
        confirmButtonColor: "#7066e0",
        imageUrl:
          "https://img.alicdn.com/imgextra/i3/917298378/O1CN01rYSA2P2BlAxmdQbE3_!!917298378.png",
        imageWidth: 150,
        footer: '<a href="line://">諮詢Anna老師</a>',
      });
      return;
    }
    mySwal.fire({
      padding: swalpadding,
      title: "提示",
      text: error,
      icon: icons,
      background: swalbkgcolor,
      confirmButtonColor: "#7066e0",
      footer: '<a href="line://">諮詢Anna老師</a>',
    });
  };
  const failPopup = () => {
    mySwal.fire({
      padding: swalpadding,
      title: luckData.current.Name,
      text: "未中獎",
      background: swalbkgcolor,
      confirmButtonColor: "#7066e0",
      imageUrl:
        "https://img.alicdn.com/imgextra/i2/917298378/O1CN01oYLUlV2BlAxl0nzaw_!!917298378.png",
      imageWidth: 150,
      footer: '<a href="line://">有問題？諮詢Anna老師</a>',
    });
  };
  const winPopup = () => {
    Swal.fire({
      padding: swalpadding,
      title: `恭喜抽中<br/><span style="color:red">${luckData.current.Name}</span>`,
      html: `<span>中獎憑證為: ${luckData.current.shortKey}，趕快聯繫Anna老師領取禮品吧</span>`,
      imageUrl: luckData.current.Image,
      allowOutsideClick: false,
      confirmButtonColor: "#07b53b",
      showCancelButton: false,
      cancelButtonText: "關閉",
      imageWidth: 150,
      background: `${swalbkgcolor} url(${wingif})`,
      backdrop: `rgba(0,0,123,0.4) url("${wingif}") left top no-repeat`,
      footer: '<a href="line://">聯繫Anna老師領獎</a>',
    })
  }

  const luckedHandler = () => {
    if (!luckData.current.Win) {
      errorhandler("抽獎機會已用完，未中獎", "info");
      return;
    }
    mySwal.fire({
      padding: swalpadding,
      title: "Sorry,已經抽過了",
      html: `<span>中獎禮品為:  ${luckData.current.Name}<br/>
      中獎憑證為:  ${luckData.current.shortKey}<br/>趕快聯繫Anna老師領取禮品吧</span>`,
      background: swalbkgcolor,
      confirmButtonColor: "#7066e0",
      imageUrl: luckData.current.Image,
      imageWidth: 150,
      footer: '<a href="line://">諮詢Anna老師</a>',
    });
  }
  const endHandler = () => {
    if (luckData.current.code === 400) {
      luckedHandler()
    } else if (luckData.current.code === 500) {
      errorhandler(luckData.current.message, "error")
    } else if (luckData.current.code === 200) {
      setTimeout(() => {
        LuckyRef.current.stop(luckData.current.Id);
      }, 2500);
    }
  }
  const setLuckyIndex = () => {
    const p = fetch(reqUrls.luckUrl, {
      method: "POST",
      redirect: 'follow',
    });
    const t = new Promise((resolve, reject) => {
      setTimeout(() => {
        reject("請求超時！");
      }, 6000);
    });
    Promise.race([p, t])
      .then(response => response.json())
      .then(result => {
        if (result.code === 400 || result.code === 200) {
          luckData.current = { code: result.code, shortKey: result.shortKey, Id: result.data.Id, Image: result.data.Image, Name: result.data.Name, Win: result.data.Win };
        }
        if (result.code === 500) {
          luckData.current = { code: result.code, message: result.message }
        }
        if (result.code !== 200) {
          LuckyRef.current.stop();
        }
        endHandler();
      })
      .catch((error) => {
        console.error(error);
        LuckyRef.current.stop();
        errorhandler("你的網路好像出了點問題，請稍後再試", "error");
      });
  }
  const getPrizesList = async () => {
    if (prizesStatus) {
      return;
    }
    prizesStatus = true;
    await fetch(reqUrls.prizesUrl, {
      method: "POST",
      redirect: 'follow',
    })
      .then((res) => res.json())
      .then((result) => {
        if (result.code !== 200) {
          Swal.fire({
            padding: swalpadding,
            position: "center",
            icon: "error",
            title: "服務器似乎出現了點問題...",
            text: "暫時無法抽獎，請稍候再重試",
            background: swalbkgcolor,
            showConfirmButton: false,
            allowOutsideClick: false,
          });
          return;
        }
        const len = result.data.length;
        const newPrizes = new Array(len).fill(null);
        result.data.forEach((item) => {
          var prizeConfig = { background: item.Id % 2 ? "#B68CF9" : "#FFFFFF", imgs: [{ src: item.Image, top: "10%", width: "40%" }] }
          newPrizes[item.Id] = prizeConfig;
        });

        setPrizes(newPrizes);
      })
      .catch((error) => {
        console.log(error)
        Swal.fire({
          padding: swalpadding,
          position: "center",
          icon: "error",
          title: "你的網路似乎有問題...",
          text: "暫時無法抽獎，請稍候再重試",
          background: swalbkgcolor,
          showConfirmButton: false,
          allowOutsideClick: false,
        });
      });
  };
  const [luckBkgStyle, setluckBkgStyle] = useState({ top: "175px" });
  const [luckyWidth, setluckyWidth] = useState("300px");
  const [luckyHeight, setluckyHeight] = useState("300px");
  const screenChangeHandler = () => {
    const ws = Number(bkgImgRef.current.offsetWidth);
    setluckBkgStyle({ top: ws / 2 + "px" });
    setluckyWidth(ws * 100 / 125 + "px");
    setluckyHeight(ws * 100 / 125 + "px");
  }

  const start = function () {
    // 开始游戏
    LuckyRef.current.play();
    setLuckyIndex();
  };
  const end = function () { // 游戏停止时触发
    setTimeout(() => {
      if (luckData.current.code !== 200) return;
      if (luckData.current.Win) {
        winPopup()
      } else {
        failPopup()
      }
    }, 200)
  };
  useEffect(() => {
    window.addEventListener("resize", screenChangeHandler);
    screenChangeHandler();
    if (!prizesStatus) {
      getPrizesList();
    }
  }, [prizesStatus]);
  return <section className="luckyContainer">
    <div className="mainBkg">
      <img src={bjimg} alt="" className="mainBkg" ref={bkgImgRef} />
    </div>
    <div className="luckBkg" style={luckBkgStyle}>
      <div className="frameBox">
        <img src="https://img.alicdn.com/imgextra/i2/917298378/O1CN01KC6HGn2BlAypmudZa_!!917298378.png" className="frameimg" alt="" />
      </div>
      <LuckyWheel
        ref={LuckyRef}
        width={luckyWidth}
        height={luckyHeight}
        blocks={blocks}
        prizes={prizes}
        buttons={buttons}
        onStart={start}
        onEnd={end}
        defaultConfig={defaultConfig}
      ></LuckyWheel>
    </div>
    <footer className="footer">
      <div>
        <img src="https://img.alicdn.com/imgextra/i2/917298378/O1CN01219yqf2BlAyoDRWhk_!!917298378.png" alt="" />
      </div>
    </footer>
  </section>
}

export default App;
