var pid = '';
var uid = '';
var page = 1;
var cid = 0;//分类
var scrollTop;//点击领券时滚动条位置（修正复制时滚动偏移）
var debugUid = 12602;

$(function () {

    initParams();

    if (performance && performance.navigation) {
        if (performance.navigation.type == 2) {//不是刷新，跳转
            if (window.history.state && window.history.state.list) {
                $('#goodsList').html(window.history.state.list);
                page = window.history.state.page + 1;
                //console.log('history - ' + page);
                document.referrer = '';
            } else {
                setState(0);
            }
        }
    }

    initCopy();

    mescrollPlugin = new MeScroll("body", {
        down: { use: false },
        up: {
            auto: page == 1,
            callback: function (p) {//上拉加载的回调
                loadCoupons();
            },
            toTop: { //配置回到顶部按钮
                src: "mescroll-totop.png", //默认滚动到1000px显示,可配置offset修改
            },
            empty: {
                tip: "暂无产品~", //提示
            },
            isBounce: false //如果您的项目是在iOS的微信,QQ,Safari等浏览器访问的,建议配置此项.解析(必读)
        }
    });

    $('#notice').marquee({
        //duration in milliseconds of the marquee
        duration: 10000,
        //gap in pixels between the tickers
        gap: 50,
        //time in milliseconds before the marquee will start animating
        delayBeforeStart: 0,
        //'left' or 'right'
        direction: 'left',
        //true or false - should the marquee be duplicated to show an effect of continues flow
        duplicated: true
    });

})

function initParams() {
    pid = $('#pid').val();
    uid = $('#uid').val();

    var keyword = getQueryString('keyword', true);
	if(keyword == "")
	{
		keyword = getQueryString('key', true)
	}
    if (keyword) $("#keyword").val(decodeURI(keyword));

    cid = getQueryString('cid');
    if (!cid) {
        cid = 0;
    } else {
        $('[class^=category]').css('color', '#000');
        $('.category' + cid).css('color', 'red');
    }
}

function getQueryString(name, noUnescape) {

    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
    var r = window.location.search.substr(1).match(reg);

    if (r != null) {
        if (noUnescape) return r[2];
        else return unescape(r[2]);
    }
    return "";
}

function calJifen(coupon) {
    //返积分数=产品券后价*佣金比例*返积分比例(20%-动态读取)*100
    var jifen = coupon.CouponPrice * coupon.CommissionRate * 0.01 * shopJifenRatio;
    jifen = Math.floor(jifen);

    if (jifen <= 0) return '-';
    else return jifen;
}
// var api_url ="http://127.0.0.1:8081";
var api_url ="https://api.thegun.cn";
//var api_url ="http://api.tb.52cmg.cn";
var version = "1.0.0.1";
function loadCoupons() { 


    $.ajax({
        url: api_url+"/api/alimama.asmx/serch_coupon",
        type: 'POST',
        //dataType: "jsonp",
        data: "title=" + encodeURIComponent($("#keyword").val())+"&page="+page+"&pid="+getQueryString("pid")+"&cat="+"&v="+version,
        async: true,
        success: function (result) {
			if(!result.ok)
			{
			    $('#goodsList').html('<b>'+result.message+'</b>'); return;
			}
			var results = result.message.tbk_item_coupon_get_response.results;
            if (results == "" || results == undefined || results == null || results.tbk_coupon.length==0) {
				$('#goodsList').html('<b>查找不到您要的商品，请更改标题再次搜索！</b><br><p>已经是最后一页啦，没有更多您想要的宝贝！</p>'); 
                mescrollPlugin.endSuccess(0, false);
                return;
            }
            var list = result.message.tbk_item_coupon_get_response.results.tbk_coupon;
            
            mescrollPlugin.endSuccess(list.length, true);
            addCoupons(list);
            setState(page);//缓存
            page++;
        }
    });
}

function gotoDetail(couponId) {
    var mallId = $('#mallId').val();

    if (couponId == 0) {
        var evt = window.event;
        var eventSrc = evt.target || evt.srcElement;
        var couponJson = $(eventSrc).closest('li').attr('data');
        
        //$.post('/Shop/AddTaobaoGoodsDetail', 'userId=' + uid + '&data=' + couponJson, function (result) {
        //    if (result.code <= 0) {
        //        bootbox.alert(result.data);
        //        return;
        //    }

        //    var id = result.data;
        //    var url = '/p/' + mallId + '/' + couponId + '/' + pid.substr(3) + '/' + uid + '/' + id;
        //    location.href = url;
        //})
    } else {
        var url = '/p/' + mallId + '/' + couponId + '/' + pid.substr(3) + '/' + uid;
        location.href = url;
    }
}

function addCoupons(data) {
    //
    + '            <a onclick="getQuan()" class="get-quan">立即领券</a>'
    var tpl =
    '<li class="row" id="{Id}" data="{CouponJson}" onclick="getQuan()">'
        + '    <div class="col-xs-4 img-box"><img class="lazy" {PicLoadType}="{pictUrl}" onclick="gotoDetail({CouponId})"/></div>'
+ '    <div class="col-xs-8 content">'
+ '        <h3 onclick="gotoDetail({CouponId})"><i><img src="{Type}.png" width="16" height="16"></i>{ShortTitle}</h3>'
+ '        <div class="detail">'
        + '            <div class="original-price"><span>优惠:</span><span>{couponAmount}元</span></div>'
+ '            <div class="sales">&nbsp;&nbsp;原价:{SalesNum}元</div>'
+ '            <div class="jifen" style="display:none;"><span></span><span>{dianpu}</span></div>'
        + '            <div class="current-price"><img class="img-tag" src="quanhou.png" /><span></span><span>{CouponPrice}&nbsp;元</span></div>'
+ '            {Shop}'
+ '        </div>'
+ '    </div>'
+ '</li>';

    var html = '';
    var itemIds = [];
    for (var i = 0; i < data.length; i++) {
        var good = data[i];
        if(!good.hasOwnProperty("coupon_info")) continue;
        //通过itemId去重（本页去重）
        var exist=false;
        for (var key in itemIds) {
            if (itemIds[key] == good.num_iid) {
                exist = true;
                break;
            }
        }
        if (exist) continue;
        else itemIds.push(good.auctionId);

        //通过itemId去重（分页间去重）
        if ($('#good_' + good.auctionId).length > 0) {
            continue;
        }

		var couponAmount =parseInt( good.coupon_info.substring(good.coupon_info.indexOf("减")+1,good.coupon_info.length-1));
        good.title = good.title.replace(/<[^>]+>/g, "");
		good.couponAmount = couponAmount;
        var s = tpl.replace('{pictUrl}', good.pict_url)
            .replace('{Type}', good.user_type==1 ? 'tianmao' : 'taobao')
            .replace('{ShortTitle}', good.title)
            .replace('{couponAmount}',couponAmount)
            .replace('{SalesNum}', good.zk_final_price)
            .replace('{CouponPrice}', (good.zk_final_price - couponAmount).toFixed(2))
            .replace('{Id}', 'good_' + good.num_iid)
            .replace('{dianpu}', good.shop_title)
            .replace(/{CouponId}/g, 0)
            .replace('{CouponJson}', encodeURIComponent(JSON.stringify(good)))
            .replace('{PicLoadType}', (page == 1 && i <= 8) ? 'src' : 'data-original')//前8张图片正常加载，之后的lazyload
            .replace('{Shop}', '');

        html += s;
    }
    $('#goodsList').append(html);
    $("img.lazy").lazyload();

    if (jifenRatioService && shopShowJifenRatio) {
        $('.jifen').show();
    }
}

function getQuan() {
    var evt = window.event;
    var eventSrc = evt.target || evt.srcElement;
    var couponJson = $(eventSrc).closest('li').attr('data');
    couponJson = decodeURIComponent(couponJson);
    var good = $.parseJSON(couponJson);

    $('#quanDetail').html('正在为您申请优惠券...');
    $('#dlgQuan').modal('show');
    scrollTop = $(document).scrollTop();


    $.ajax({
        url: api_url+"/api/alimama.asmx/create_buy",
        type: 'POST',
        // dataType: "jsonp",
        data: "text=" + encodeURIComponent(good.title) + "&item_id=" + good.num_iid + "&img=" + encodeURIComponent(good.pict_url)+"&pid="+getQueryString("pid")+"&v="+version,
        async: true,
        success: function (result) {
            if (!result.ok) {
                bootbox.alert(result.message);
                $('#quanDetail').html('优惠券申请失败');
                return;
            }
          
            var message = result.message;
            good.token = message.token;
            good.click = message.click;
            var idSelector = '#good_' + good.num_iid;
            var priceSelector = idSelector + ' .current-price span:nth-child(3)';
           // $(idSelector + ' .jifen span:nth-child(2)').html('');
            //$(priceSelector).html((good.zk_final_price - good.couponAmount).toFixed(2));
         //   var quanSelector = idSelector + ' .quan';
          //  $(quanSelector).html(good.quan);
            showQuan(good);
        }
    });
}

function showQuan(good) {
    var s = good.title + '<br/>'
        + '【在售价】：' + good.zk_final_price+ '元<br/>'
        + '【优惠券】：' + good.couponAmount.toFixed(2) + '元<br/>'
        + '【券后价】：' + (good.zk_final_price - good.couponAmount).toFixed(2) + '元<br/>'
//+ (good.SalesNum > 0 ? '月销量：' + good.SalesNum + '件<br/>' : '')
+ '复制这条消息' + good.token + '，打开【手机淘宝】即可领取并下单';
    $('#quanDetail').html(s);
    $("#btnCopy").text("一键复制").addClass("btn-danger").removeClass("btn-success")
        .attr("data-clipboard-text", s.replace(/<br\/>/g, '\n'));
        $('#btnCopyPc').attr("url", good.click);
    
}

function  openTbApp(url)  {
        var  ua  =  navigator.userAgent.toLowerCase();
        var  tb  =  url.replace("http://",  "").replace("https://",  "");
        if ( ua.match(/iphone os 9/i)  ==  "iphone os 9" )  {
                window.location  =  "taobao://"  +  tb;
                window.setTimeout(function ()  { window.location  =  url; }, 4000);
        } else {
                var  ifr  =  document.createElement('iframe');
                ifr.src  =  'taobao://'  +  tb;
                ifr.style.display  =  'none';
                document.body.appendChild(ifr);
                window.location  =  url;
    }
}
function btnCopyPcClick() {
     window.open($("#btnCopyPc").attr("url"));  
}

function IsPC() {
    var userAgentInfo = navigator.userAgent;
    var Agents = ["Android", "iPhone",
        "SymbianOS", "Windows Phone",
        "iPad", "iPod"];
    var flag = true;
    for (var v = 0; v < Agents.length; v++) {
        if (userAgentInfo.indexOf(Agents[v]) > 0) {
            flag = false;
            break;
        }
    }
    return flag;
}

function stringToHex(str) {
    　　　　var val = "";
    　　　　for (var i = 0; i < str.length; i++) {

        　　　　　　if (val == "")
            　　　　　　　　val = str.charCodeAt(i).toString(16);
        　　　　　　else
            　　　　　　　　val += "," + str.charCodeAt(i).toString(16);
    　　　　}
    　　　　return val;
　　}

function initCopy() {
    //bootstrap modal要兼容clipboard.js必须加这句
    $.fn.modal.Constructor.prototype.enforceFocus = function () { };

    var clipboard = new Clipboard("#btnCopy");
    clipboard.on('success', function (e) {
        $("#btnCopy").text("复制成功").addClass("btn-success").removeClass("btn-danger");
        window.setTimeout(function () {
            $(document).scrollTop(scrollTop);
        }, 500);
    });
}

function setState(p) {
    //console.log('setState - ' + p);
    var statusUrl = window.location.href;
    var stateobj = ({
        //里面存放url等信息，stateobj将作为pushState()的第一个参数
        url: statusUrl,
        list: p > 0 ? $('#goodsList').html() : '',
        title: '',
        page: p
    });
    if (window.history.state) {
        window.history.replaceState(stateobj, null, statusUrl);//将当前url加入堆栈中
    } else {
        window.history.pushState(stateobj, null, statusUrl);//将当前url加入堆栈中
    }
};

function debugAlert(s) {
    if (uid == debugUid) {
        alert(s);
    }
}