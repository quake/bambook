var bb = document.getElementById('bambookplugin');  
var sn = "";
var guid = "";

$.template("bambook_book_template", "<tr guid='${guid}'><td>${name}</td><td>${author}</td><td><a href='#' class='upload'>上传</a> <a href='#' class='delete'>删除</a></td></tr>");
$.template("server_book_template", "<tr sid='${id}'><td>${name}</td><td>${author}</td><td><a href='#' class='download'>下载</a> <a href='#' class='delete'>删除</a> 共享</td></tr>");

function refreshBambookBooks() {
    $("#bambook_books").empty();
    $.tmpl("bambook_book_template", bb.getPrivBookInfos()).appendTo("#bambook_books");
    hideMessage();
}

function refreshServerBooks() {
    $.get("/books.json", {
        sn: sn
    },
    function(data){
        $("#server_books").empty();
        $.tmpl("server_book_template", data).appendTo("#server_books");
    });
}

function connect() {
    var result = bb.connect($("#bambook_ip").val());
    if(result == 0) {
        sn = bb.getDeviceInfo()["sn"];
        $('#message').html("连接成功，正在获取Bambook上的自有书籍");
        setTimeout(refreshBambookBooks, 1000);
        setTimeout(refreshServerBooks, 1000);
    }else{
        $('#message').html("连接错误: " + result);
        hideMessage();
    }
}

function addEvent(name, func) {
    if (window.addEventListener) {
        bb.addEventListener(name, func, false);
    } else {
        bb.attachEvent("on"+name, func);
    }
}

function popupMessage(message) {
    $('#message').html(message);
    $.blockUI({
        message: $('#message')
    });
}

function hideMessage() {
    setTimeout($.unblockUI, 1500);
}

addEvent('privbooktrans', function(state, progress, userdata){
    $("#message").html("和Bambook通讯中: " + progress + " / 100");
    if(state == 1) {
        refreshBambookBooks();
    }
});

addEvent('privbooktransbyrawdata', function(data){
    $("#message").html("正在上传到服务器");
    var book = $("tr[guid='" + guid + "']");
    $.post("/books", {
        sn: sn, 
        guid: guid,
        name: book.children()[0].innerHTML,
        author: book.children()[1].innerHTML,
        data: data
    }, function(data) {
        $('#message').html("上传完毕");
        refreshServerBooks();
        hideMessage();
    });
});

$(function() {
    $("#btn_connect").click(function() {
        popupMessage("正在连接到Bambook")
        setTimeout(connect, 2000);
    });

    $("#bambook_books a.upload").live('click', function() {
        guid = $(this).parent().parent().attr("guid");
        popupMessage("和Bambook通讯中: 0 / 100");
        bb.fetchPrivBookByRawData(guid);
        return false;
    });

    $("#bambook_books a.delete").live('click', function() {
        if(confirm("你确定要在Bambook上删除这本书吗？")) {
            bb.deletePrivBook($(this).parent().parent().attr("guid"));
            refreshBambookBooks();
            return false;
        }
    });

    $("#server_books a.download").live('click', function() {
        popupMessage("正在从服务器下载");
        var sid = $(this).parent().parent().attr("sid");
        $.get("/books/" + sid + "?sn=" + sn, 
            function(data){
                bb.addPrivBookByRawData("temp.snb", data);
            });
        return false;
    });

    $("#server_books a.delete").live('click', function() {
        if(confirm("你确定要在服务器上删除这本书吗？")) {
            var sid = $(this).parent().parent().attr("sid");
            $.post("/books/" + sid + "?sn=" + sn, {
                "_method": "delete"
            },
            function(data) {
                refreshServerBooks();
            });
            return false;
        }
    });
});

$(window).unload(function() {
    bb.disconnect();
});

$.ajaxSetup({
    cache: false
});

