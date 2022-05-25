import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import Swal from "sweetalert2";
const getQueryVariable = (variable) => {
  var query = window.location.search.substring(1);
  var vars = query.split("&");
  for (var i = 0; i < vars.length; i++) {
    var pair = vars[i].split("=");
    if (pair[0] === variable) { return pair[1]; }
  }
  return (false);
}

const isMobileHandler = () => {
  const currentPlatform = window?.navigator.platform;
  if (!currentPlatform || !window || !window.sessionStorage) {
    Swal.fire({
      title: "不支持當前瀏覽器",
      text: "請更換瀏覽器!",
      icon: "warning",
      allowOutsideClick: false,
      showConfirmButton: false,
    });
    return null;
  }
  if (getQueryVariable("mode") !== "dev") {
    if (!/(iPhone|iPad|iPod|iOS|Android)/i.test(navigator.userAgent)) {
      Swal.fire({
        title: "網頁不允許當前設備訪問",
        text: "請使用移動設備訪問!",
        icon: "warning",
        allowOutsideClick: false,
        showConfirmButton: false,
      });
      return null;
    }
  }
  return <App />;
};
ReactDOM.render(
  <React.StrictMode>
    {isMobileHandler()}
  </React.StrictMode>,
  document.getElementById('root')
);
