console.log(`hello`);
let orderData = [];
const orderList = document.querySelector(".js-orderList");

//初始化(即先取得訂單資料)
init();
function init() {
    getOrderList();
};

//取得前台送出的訂單資料
function getOrderList() {
    axios.get(`https://livejs-api.hexschool.io/api/livejs/v1/admin/${api_path}/orders`, {
        headers: {
            'Authorization': token,
        }
    })
        .then(function (response) {
            orderData = response.data.orders;
            let str = '';
            orderData.forEach(function (item) {
                //組時間字串
                const timeStamp = new Date(item.createdAt * 1000);//*1000才能符合new Date 裡面規定的數字格式(13碼)，到毫秒
                const orderTime = `${timeStamp.getFullYear()}/${timeStamp.getMonth() + 1}/${timeStamp.getDate()}`;


                //組產品字串(當該訂單內有很多品項時。需要顯示所有品項於畫面)
                let productStr = "";
                item.products.forEach(function (productItem) {
                    productStr += `<p>${productItem.title}*${productItem.quantity}</p>`

                });
                //判斷訂單處理狀態
                let orderStatus = "";
                if (item.paid == true) {
                    orderStatus = "已處理"
                } else {
                    orderStatus = "未處理"
                };

                //組訂單字串
                str += `<tr>
            <td>${item.id}</td>
            <td>
                <p>${item.user.name}</p>
                <p>${item.user.tel}</p>
            </td>
            <td>${item.user.address}</td>
            <td>${item.user.email}</td>
            <td>
                ${productStr}
            </td>
            <td>${orderTime}</td>
            <td class="js-orderStatus">
                <a href="#" data-status="${item.paid}" data-id="${item.id}" class="orderStatus">${orderStatus}</a>
            </td>
            <td>
                <input type="button" class="delSingleOrder-Btn js-orderDelete" data-id="${item.id}" value="刪除">
            </td>
            </tr>`
            });
            orderList.innerHTML = str;
            //renderC3();//製作圖表
            renderC3_lv2()
        })
};

//監聽點擊動作
orderList.addEventListener("click", function (e) {
    e.preventDefault();
    const targetClass = e.target.getAttribute("class");
    console.log(targetClass);
    let id = e.target.getAttribute("data-id");//因為很多地方會用到id，故特別把它拉到外層
    if (targetClass == "delSingleOrder-Btn js-orderDelete") {
        deletOrderItem(id)
        return;
    }

    if (targetClass == "orderStatus") {
        let status = e.target.getAttribute("data-status");
        changeOrderStatus(status, id);
        //console.log(status,id)
        return;
    }
});

//修改訂單狀態
function changeOrderStatus(status, id) {
    console.log(status, id);
    let newStatus;
    if (status == true) {
        newStatus = false;
    } else {
        newStatus = true;
    };
    axios.put(`https://livejs-api.hexschool.io/api/livejs/v1/admin/${api_path}/orders`, {

        "data": {
            "id": id,
            "paid": newStatus
        }
    }, {
        headers: {
            'Authorization': token,
        }
    })
        .then(function (response) {
            alert('修改訂單狀態成功');
            getOrderList();
        })
};

//刪除訂單
function deletOrderItem(id) {
    console.log(id);

    axios.delete(`https://livejs-api.hexschool.io/api/livejs/v1/admin/${api_path}/orders/${id}`, {
        headers: {
            'Authorization': token,
        }
    })
        .then(function (response) {
            alert('刪除該筆訂單成功');
            getOrderList();
        })
};

//c3 圖表 LV1
function renderC3() {
    console.log(orderData);
    //物件資料蒐集
    let total = {};
    orderData.forEach(function (item) {
        item.products.forEach(function (productItem) {
            //使用物件的「括弧記法」取值，來判斷total裡是否已有該資料
            if (total[productItem.category] == undefined) {
                total[productItem.category] = productItem.price * productItem.quantity;
            } else {
                total[productItem.category] += productItem.price * productItem.quantity;
            }
        })
    });
    console.log(total);
    //做出資料關聯、把資料整理成C3指定的格式
    let categoryAry = Object.keys(total);
    console.log(categoryAry);
    let newData = [];
    categoryAry.forEach(function (item) {
        let ary = [];
        ary.push(item);
        ary.push(total[item]);
        newData.push(ary);
    });

    let chart = c3.generate({
        bindto: '#chart', // HTML 元素綁定
        data: {
            type: "pie",
            columns: newData,

        },
    });
};

//c3 圖表 LV2
function renderC3_lv2() {
    //資料蒐集
    let obj = {};
    orderData.forEach(function (item) {

        item.products.forEach(function (productItem) {
            if (obj[productItem.title] === undefined) {
                obj[productItem.title] = productItem.quantity * productItem.price;
            } else {
                obj[productItem.title] += productItem.quantity * productItem.price;
            }
        })

    });


    console.log(obj);
    //資料關聯
    let originAry = Object.keys(obj);
    console.log(originAry);
    //透過originAry 整理成c3格式
    let rankSortAry = [];
    originAry.forEach(function (item) {
        let ary = [];
        ary.push(item);
        ary.push(obj[item]);
        rankSortAry.push(ary);
        
    });
    console.log(rankSortAry);

    //比大小，降冪排列(目的: 為了要讓營收前三名的品項當主要色塊，把其他第四名以後的品項加總起來當成一個色塊)
    rankSortAry.sort(function (a, b) {
        return b[1] - a[1];
    })

    //如果筆數超過4筆以上，就統整為其它
    if (rankSortAry.length > 3) {
        let otherTotal = 0;
        rankSortAry.forEach(function (item, index) {
            if (index > 2) {
                otherTotal += rankSortAry[index][1];
            }
        })
        rankSortAry.splice(3, rankSortAry.length - 1);
        rankSortAry.push(['其他', otherTotal]);
    }

    let chart = c3.generate({
        bindto: '#chart', // HTML 元素綁定
        data: {
            type: "pie",
            columns: rankSortAry,

        },
        color:{
            pattern: ["#301E5F","#5434A7","#9D7FEA", "#DACBFF"]
        }
    });
};

//清除全部訂單
const discardAllBtn = document.querySelector(".discardAllBtn");
discardAllBtn.addEventListener("click", function (e) {
    e.preventDefault();
    axios.delete(`https://livejs-api.hexschool.io/api/livejs/v1/admin/${api_path}/orders`, {
        headers: {
            'Authorization': token,
        }
    })
        .then(function (response) {
            alert('刪除全部訂單成功');
            getOrderList();
        })
});

