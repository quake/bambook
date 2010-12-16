var bb = document.getElementById('bambookplugin');  
var sn = "";
var guid = "";

$.template("bambook_book_template", "<tr guid='${guid}'><td>${name}</td><td>${author}</td><td><a href='#' class='upload'>上传</a> <a href='#' class='delete'>删除</a></td></tr>");
$.template("server_book_template", "<tr sid='${id}'><td>${name}</td><td>${author}</td><td><a href='#' class='download'>下载</a> <a href='#' class='delete'>删除</a> ${share}</td></tr>");

function refreshBambookBooks() {
    $("#bambook_books").empty();
    $.tmpl("bambook_book_template", bb.getPrivBookInfos()).appendTo("#bambook_books");
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

function addEvent(name, func) {
    if (window.addEventListener) {
        bb.addEventListener(name, func, false);
    } else {
        bb.attachEvent("on"+name, func);
    }
}

addEvent('privbooktrans', function(state, progress, userdata){
    console.log(state + " | " + progress + " | " + userdata);
});

addEvent('privbooktransbyrawdata', function(data){
    console.log("privbooktransbyrawdata");
    var book = $("tr[guid='" + guid + "']");
    $.post("/books", {
        sn: sn, 
        guid: guid,
        name: book.children()[0].innerHTML,
        author: book.children()[1].innerHTML,
        data: data
    });
});

$(function() {
    $("#btn_connect").click(function() {
        var result = bb.connect($(this).next().val());
        if(result == 0) {
            sn = bb.getDeviceInfo()["sn"];
            alert("连接成功");
        }else{
            alert("连接错误: " + result);
        }
    });

    $("#btn_list").click(function() {
        refreshBambookBooks();
    });

    $("#bambook_books a.upload").live('click', function() {
        guid = $(this).parent().parent().attr("guid");
        bb.fetchPrivBookByRawData(guid);
        return false;
    });

    $("#bambook_books a.delete").live('click', function() {
        if(confirm("你确定要删除这本书吗？")) {
            bb.deletePrivBook($(this).parent().parent().attr("guid"));
            return false;
        }
    });

    $("#server_books a.download").live('click', function() {
        var sid = $(this).parent().parent().attr("sid");
        $.get("/books/" + sid + "?sn=" + sn, 
            function(data){
                bb.addPrivBookByRawData("temp.snb", data);
            });
        return false;
    });
    
});

$(window).unload(function() {
    bb.disconnect();
});