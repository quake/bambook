var bb = document.getElementById('bambookplugin');  
var sn = "";
var guid = "";

$.template("bambook_book_template", "<tr guid='${guid}'><td>${name}</td><td>${author}</td><td><a href='#' class='upload'>上传</a> <a href='#' class='delete'>删除</a></td></tr>");

function refreshBambookBooks() {
    $('#server_books').hide();
    if(bb.valid) {
        if(bb.getConnectStatus() == 0) {
            $('#bambook_books').show();
            popupMessage("正在获取Bambook上的自有书籍信息");

            var bambook_books = $("#bambook_books tbody")
            bambook_books.empty();
            $.tmpl("bambook_book_template", bb.getPrivBookInfos()).appendTo(bambook_books);
            hideMessage();
        }else{
            $("#box").show();
        }
    }else{
        $("#install_plugin").show();
    }
}

function refreshServerBooks(url) {
    $('#box').hide();
    $('#bambook_books').hide();
    $('#server_books').show();
    popupMessage("正在获取服务器上的数据");
    
    $.get(url, {
        sn: sn
    },
    function(data){
        $("#server_books").html(data);
        hideMessage();
    });
}

function connect() {
    var result = bb.connect($("#bambook_ip").val());
    if(result == 0) {
        sn = bb.getDeviceInfo()["sn"];
        $('#box').hide();
        refreshBambookBooks();
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
    updateMessage(message);
    $.blockUI({
        message: $('#message')
    });
}

function updateMessage(message) {
    $('#message span').html(message);
}

function hideMessage() {
    setTimeout($.unblockUI, 1500);
}

addEvent('privbooktrans', function(state, progress, userdata){
    if(state == 0) {
        updateMessage("正在和Bambook传输: " + progress + " / 100");
    }else if(state == 1){
        updateMessage("传输完成");
        $.unblockUI();
    }else if(state == 2) {
        updateMessage("传输失败, 请重试");
        hideMessage();
    }
});

addEvent('privbooktransbyrawdata', function(data){
    popupMessage("正在上传到服务器");
    var book = $("tr[guid='" + guid + "']");
    $.post("/books", {
        sn: sn, 
        guid: guid,
        name: book.children()[0].innerHTML,
        author: book.children()[1].innerHTML,
        data: data
    }, function(data) {
        updateMessage("上传完毕");
        hideMessage();
    });
});

$(function() {
    $("#btn_connect").click(function() {
        popupMessage("正在连接到Bambook")
        setTimeout(connect, 2000);
        return false;
    });

    $("#bambook_books a.upload").live('click', function() {
        guid = $(this).parent().parent().attr("guid");
        popupMessage("和Bambook通讯中: 0 / 100");
        bb.fetchPrivBookByRawData(guid);
        return false;
    });

    $("#bambook_books a.delete").live('click', function() {
        if(confirm("您确定要在Bambook上删除这本书吗？")) {
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

    $("#server_books a.download-share").live('click', function() {
        if(sn == "") {
            popupMessage("您需要先连接到Bambook才能下载");
            hideMessage();
        }else{
            popupMessage("正在从服务器下载");
            var sid = $(this).parent().parent().attr("sid");
            $.get("/share_books/" + sid,
                function(data){
                    bb.addPrivBookByRawData("temp.snb", data);
                });
        }
        return false;
    });

    $("#server_books a.delete").live('click', function() {
        if(confirm("您确定要在服务器上删除这本书吗？")) {
            var container = $(this).parent().parent();
            $.post("/books/" + container.attr("sid") + "?sn=" + sn, {
                "_method": "delete"
            },
            function(data) {
                container.remove();
            });
            return false;
        }
    });

    $("#server_books a.share").live('click', function() {
        var container = $(this).parent().parent();
        $.post("/books/" + container.attr("sid") + "?sn=" + sn, {
            "_method": "put"
        },
        function(data) {
            container.replaceWith(data);
        });
        return false;
    });

    $("#main-navigation a").click(function(){
        $("#main-navigation li").removeClass("active");
        $(this).parent().addClass("active");
        switch ($(this).attr("id")) {
            case "my_server_books":
                refreshServerBooks("/books");
                break;
            case "my_bambook_books":
                refreshBambookBooks();
                break;
            case "other_shares":
                refreshServerBooks("/share_books");
                break;
            case "subscriptions":
                refreshServerBooks("/subscriptions");
                break;
            default:
                break;
        }
        return false;
    });

    $("div.pagination a, #server_books ul a").live('click', function() {
        $("#server_books").load($(this).attr("href"));
        return false;
    });

    refreshBambookBooks();
});

$(window).unload(function() {
    try{
        bb.disconnect();
    }catch(e){
    //ignore;
    }
});

$.ajaxSetup({
    cache: false
});

var Theme = {
    activate: function(name) {
        window.location.hash = 'themes/' + name
        Theme.loadCurrent();
    },

    loadCurrent: function() {
        var hash = window.location.hash;
        if (hash.length > 0) {
            matches = hash.match(/^#themes\/([a-z0-9\-_]+)$/);
            if (matches && matches.length > 1) {
                $('#current-theme').attr('href', '/stylesheets/themes/' + matches[1] + '/style.css');
            } else {
                alert('theme not valid');
            }
        }
    }
}