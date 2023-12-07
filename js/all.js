
const productList = document.querySelector('.productWrap');
const productSelect = document.querySelector('.productSelect');
const cartList = document.querySelector('.shoppingCart-tableList');
let productData = [];
let cartData = [];

//初始化(即取得最一開始的產品列表與購物車列表)
init()
function init(){
    getProductList();
    getCartList();
};

//產品列表外框(用來組字串)
function combineProductHtmlItem(item){
    //因為需要回傳組好的字串內容，故需要代參數item, 把在renderProductList()與productSelect篩選功能裡的值代入
    //並用return 才會傳出值
    return `<li class="productCard">
    <h4 class="productType">新品</h4>
    <img src="${item.images}"
        alt="">
    <a href="#" class="js-addCart" data-id=${item.id}>加入購物車</a>
    <h3>${item.title}</h3>
    <del class="originPrice">NT$${toThousands(item.origin_price)}</del>
    <p class="nowPrice">NT$${toThousands(item.price)}</p>
    </li>`;
};

//取得產品列表
function getProductList(){
    axios.get(`https://livejs-api.hexschool.io/api/livejs/v1/customer/${api_path}/products`)
  .then(function (response) {
    //console.log(response.data.products);
    productData = response.data.products;//賦予此陣列新的值
    renderProductList();
  })
  .catch(function (error) {
    console.log(error);
  })
};

//渲染產品列表
function renderProductList(){
    let str = '';
    productData.forEach(function(item){
        str += combineProductHtmlItem(item);
    });
    productList.innerHTML = str;
};


//產品列表篩選
productSelect.addEventListener('change',function(e){
    console.log(e.target.value);
    const category = e.target.value;
    if(category === '全部'){
        renderProductList();
        return;
    };
    let str = "";
    productData.forEach(function(item){
        if(item.category == category){
        //     str += `<li class="productCard">
        // <h4 class="productType">新品</h4>
        // <img src="${item.images}"
        //     alt="">
        // <a href="#" class="addCardBtn">加入購物車</a>
        // <h3>${item.title}</h3>
        // <del class="originPrice">${item.origin_price}</del>
        // <p class="nowPrice">${item.price}</p>
        // </li>
        // `
        str += combineProductHtmlItem(item);
        //重構寫法，用函式減少重覆的程式碼

        }
    })

    productList.innerHTML = str;

});

//監聽加入購物車接鈕
//把監聽綁在最外層ul，就不用一個一個綁監聽在btn上，影響效能
productList.addEventListener("click",function(e){
    e.preventDefault();//讓其不會一直往頁面上跑，href="#"問題

    //確保user 可以點在正確的按鈕上
    let addCartClass = e.target.getAttribute("class");
    if (addCartClass !== "js-addCart"){
        alert("請點擊「加入購物車按鈕」")
        return; //當點到非「加入購物車按鈕的地方時就中斷不跑後面的程式
    };
    let productId = e.target.getAttribute("data-id");
    console.log(productId);
    
    //進行加入購物車程序
    //首先比對，若購物車裡的品項 等於 點擊當下要加入的品項 (用ID判斷) 時，
    //判斷 購物車內是否已有此品項，如有，則本來的數量再往上加1，如否，再直接傳1
    let numCheck = 1;
    cartData.forEach(function(item){
        //如符合if條件，則numCheck會被重新賦值+=1，若不符則numCheck 維持原來的1
        if(item.product.id === productId){
            numCheck = item.quantity += 1; 
        }
    });
    console.log(numCheck);//會在每一次的cartData 迴圈後進行

    //把這些品項放入購物車裡
    axios.post(`https://livejs-api.hexschool.io/api/livejs/v1/customer/${api_path}/carts`,{
        "data": {
            "productId": productId,
            "quantity": numCheck
          }
    }).then(function(response){
        
        alert("加入購物車")
        getCartList();//重新宣染(更新)購物車
    })
});

//取得購物車列表
function getCartList(){
    axios.get(`https://livejs-api.hexschool.io/api/livejs/v1/customer/${api_path}/carts`)
    .then(function(response){
        document.querySelector(".js-total").textContent = toThousands(response.data.finalTotal);
        cartData = response.data.carts;
        //計算總金額
        //console.log(response.data.finalTotal);
        
        let str = "";
        cartData.forEach(function(item){
            str += `<tr>
            <td>
                <div class="cardItem-title">
                    <img src="${item.product.images}" alt="">
                    <p>${item.product.title}</p>
                </div>
            </td>
            <td>NT$${toThousands(item.product.price)}</td>
            <td>${item.quantity}</td>
            <td>NT$${toThousands(item.product.price*item.quantity)}</td>
            <td class="discardBtn">
                <a href="#" class="material-icons" data-id="${item.id}">
                    clear
                </a>
            </td>
        </tr>`
        });
       
        cartList.innerHTML = str;
    })
};

//刪除購物車內單筆品項
//需先綁監聽在購物車列表上
cartList.addEventListener('click',function(e){
    e.preventDefault();
    //在每項購物車品項的x上 埋好該品項id，這樣後面才知道要刪除誰
    const cartId = e.target.getAttribute("data-id");
    if(cartId == null){
        alert("請點擊於正確的按鈕上")
        return;
    };
    console.log(cartId);
    axios.delete(`https://livejs-api.hexschool.io/api/livejs/v1/customer/${api_path}/carts/${cartId}`)
    .then(function(response){
        alert(`刪除單筆購物車成功`);
        getCartList();//重新宣染(更新)購物車
    })
});

//刪除全部購物車流程
const discardAllBtn = document.querySelector(".discardAllBtn");
discardAllBtn.addEventListener("click",function(e){
    e.preventDefault();
    axios.delete(`https://livejs-api.hexschool.io/api/livejs/v1/customer/${api_path}/carts`)
    .then(function(response){
        alert("刪除全部購物車成功");
        getCartList();//重新宣染(更新)購物車
    })
    .catch(function(response){
        alert("購物車已清空，請物重複點擊")
    })
});

//送出訂單
const orderInfoBtn = document.querySelector(".orderInfo-btn");
orderInfoBtn.addEventListener("click",function(e){
    e.preventDefault();
    console.log(`你被點擊了`);
    //驗證購物車真的有資料再送出
    if(cartData.length == 0){
        alert(`請加入購物車`);
        return;

    }else{
        alert(`你購物車有資料，可送出訂單`)
    };

    const customerName = document.querySelector("#customerName").value;
    const customerPhone = document.querySelector("#customerPhone").value;
    const customerEmail = document.querySelector("#customerEmail").value;
    const customerAddress = document.querySelector("#customerAddress").value;
    const customerTradeWay = document.querySelector("#tradeWay").value;
    console.log(customerName,customerPhone,customerEmail,customerAddress,customerTradeWay);
    if(customerName == "" || customerPhone == "" || customerEmail== "" || customerAddress== "" || customerTradeWay == ""){
        alert("請輸入訂單資訊");
        return;
    }

    axios.post(`https://livejs-api.hexschool.io/api/livejs/v1/customer/${api_path}/orders`,{
        "data": {
            "user": {
              "name": customerName,
              "tel": customerPhone,
              "email": customerEmail,
              "address": customerAddress,
              "payment": customerTradeWay
            }
          }
    }).then(function(response){
        alert("訂單建立成功");
        document.querySelector("#customerName").value="";
        document.querySelector("#customerPhone").value="";
        document.querySelector("#customerEmail").value="";
        document.querySelector("#customerAddress").value="";
        document.querySelector("#tradeWay").value="ATM";
        getCartList();//重新宣染(更新)購物車
    })
});

//util js
function toThousands(x){
    let parts = x.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g,",");
    return parts.join(".");//回傳轉型結果
};

//表單驗證
const inputs = document.querySelectorAll("input[name],select[data-payment]");
const form = document.querySelector(".orderInfo-form");
const constraints = {
    //寫一個物件把規則寫好
    "姓名": {
        presence: {
          message: "必填欄位"
        }
      },
      "電話": {
        presence: {
          message: "必填欄位"
        },
        length: {
          minimum: 8,
          message: "需超過 8 碼"
        }
      },
      "信箱": {
        presence: {
          message: "必填欄位"
        },
        email: {
          message: "格式錯誤"
        }
      },
      "寄送地址": {
        presence: {
          message: "必填欄位"
        }
      },
      "交易方式": {
        presence: {
          message: "必填欄位"
        }
      },
};

inputs.forEach(function(item){
    item.addEventListener("change", function(){
        item.nextElementSibling.textContent = '';
        //validate(form, constraints) 會回傳一個值，表示驗證的結果。接著使用 || 運算子，這是邏輯 OR 運算子。如果 validate 函式返回的值是假值（false），即沒有資料有誤，則 errors 變數會被賦予空字串 '';如果返回的是一個物件(代表驗證錯誤)，errors 將會是一個代表錯誤訊息的物件
        //errors 變數將存儲驗證結果，用於後續的程式碼，來決定是否要顯示錯誤訊息或執行其他相關操作。
        
        let errors = validate(form,constraints) || '';
        console.log(errors);

        if (errors) {
            Object.keys(errors).forEach(function (keys) {
              // console.log(document.querySelector(`[data-message=${keys}]`))
              document.querySelector(`[data-message="${keys}"]`).textContent = errors[keys];
            })
          }
    })
})