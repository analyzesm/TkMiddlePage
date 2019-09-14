var searchType = 'mall';
$(function () {
    $('input[name=searchType]').change(function () {
        loadCouponsByKeyword();
    });

    var st = getQueryString('searchType');
    if (st) {
        searchType = st;
        $('input[name=searchType][value=' + searchType + ']').attr("checked", "checked");
    }
    
	$('.icon_clear').on('click',function(){
		$('#keyword').val('');
	})

})

function loadCouponsByKeyword() {
    searchType = $('input[name=searchType]:checked').val();
    if (!searchType) searchType = 'mall';
    var key = $("#keyword").val();

    var href = location.href;
    var sym = '&';
    if (href.indexOf('searchType') >= 0) {
        href = href.replace(/[&\?]searchType=[^&\?]*/g, sym + 'searchType=' + searchType);
    } else {
        href += sym + 'searchType=' + searchType;
    }

    sym = '&';
    if (href.indexOf('keyword') >= 0) {
        href = href.replace(/[&\?]keyword=[^&\?]*/g, sym + 'keyword=' + encodeURI(key));
    } else {
        href += sym + 'keyword=' + encodeURI(key);
    }

    sym = '&';
    if (href.indexOf('cid') >= 0) {
        href = href.replace(/[&\?]cid=[^&\?]*/g, sym + 'cid=' + cid );
    } else {
        href += sym + 'cid=' + cid;
    }

    if (href.indexOf('?') < 0) href = href.replace('&', '?');

    location.href = href;
    //mescrollPlugin.resetUpScroll();//重置滚动插件
}

function loadCouponsByCategory(category) {
    //重复点击,toggle
    if (cid == category) {
        cid = 0;
    } else {
        cid = category;
    }

    loadCouponsByKeyword();
}

function getLoadCouponsUrl() {
    var key = $("#keyword").val();
    return '/Shop/GetCoupons?keyword=' + key + '&page=' + page + '&cid=' + cid + "&uid=" + uid
        + "&pid=" + pid + "&searchType=" + searchType + '&dataokeBag=' + dataokeBagService;
}
