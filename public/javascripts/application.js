//TODO show progress with XMLHTTP upload/download if possible
var bb = document.getElementById('bambookplugin');  
var sn = "";
var guid = "";
var uploading = false;
var bambook_changed = true;

$.template("bambook_book_template", "<tr guid='${guid}'><td>${name}</td><td>${author}</td><td>{{if uploaded}}已上传{{else}}<a href='#' class='upload'>上传</a>{{/if}} <a href='#' class='delete'>删除</a></td></tr>");

function refreshBambookBooks() {
    $('#server_books').hide();
    if(bb.valid) {
        if(bb.getConnectStatus() == 0) {
            $('#bambook_books').show();
            if(bambook_changed) {
                popupMessage("正在获取Bambook上的自有书籍信息");

                var bambook_books = bb.getPrivBookInfos();
                $.get("/books/uploaded", {
                    sn: sn,
                    guid: $(bambook_books).map(function(){
                        return this["guid"]
                    }).get().join(",")
                }, function(data) {
                    var uploaded_guids = data.split(",")
                    $(bambook_books).each(function() {
                        this["uploaded"] = ($.inArray(this["guid"], uploaded_guids) != -1);
                    });
                    $("#bambook_books tbody").html($.tmpl("bambook_book_template", bambook_books));
                    bambook_changed = false;
                    hideMessage();
                })
            }
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
        filterServerBooks();
        hideMessage();
    });
}

function filterServerBooks() {
    var guids = $("#bambook_books tr").map(function() {
        return $(this).attr("guid")
    });

    $("#server_books tr").each(function() {
        var guid = $(this).attr("guid");
        if($.inArray(guid, guids) != -1) {
            $("tr[guid='" + guid + "'] a.download").replaceWith("已有");
            $("tr[guid='" + guid + "'] a.download-share").replaceWith("已有");
        }
    })
}

function connect() {
    var result = bb.connect($("#bambook_ip").val());
    if(result == 0) {
        sn = bb.getDeviceInfo()["sn"];
        $('#box').hide();
        refreshBambookBooks();
    }else{
        updateMessage("连接错误: " + result);
        hideMessage();
    }
}

function addEvent(name, func) {
    if (window.addEventListener) {
        bb.addEventListener(name, func, false);
    }
    else {
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
    setTimeout($.unblockUI, 1200);
}

addEvent('privbooktrans', function(state, progress, userdata){
    if(state == 0) {
        updateMessage("正在和Bambook传输: " + progress + " / 100");
    }else if(state == 1){
        //FIXME need refactor
        if(!uploading){
            updateMessage("传输完成");
            hideMessage();
        }
    }else if(state == 2) {
        updateMessage("传输失败, 请重试");
        hideMessage();
    }
});

addEvent('privbooktransbyrawdata', function(data){
    popupMessage("正在上传到服务器 (服务器带宽有限，需要较长时间，请耐心等待)");
    var book = $("tr[guid='" + guid + "']");
    $.post("/books", {
        sn: sn, 
        guid: guid,
        name: book.children()[0].innerHTML,
        author: book.children()[1].innerHTML,
        data: data
    }, function() {
        updateMessage("上传完毕");
        $("tr[guid='" + guid + "'] a.upload").replaceWith("已上传");
        hideMessage();
        uploading = false;
    });
});

$(function() {
    $("#btn_connect").click(function() {
        popupMessage("正在连接到Bambook")
        setTimeout(connect, 2000);
        return false;
    });

    $("#bambook_books a.upload").live('click', function() {
        //FIXME need refactor
        uploading = true;
        guid = $(this).parent().parent().attr("guid");
        popupMessage("和Bambook通讯中: 0 / 100");
        bb.fetchPrivBookByRawData(guid);
        return false;
    });

    $("#bambook_books a.delete").live('click', function() {
        if(confirm("您确定要在Bambook上删除这本书吗？")) {
            bb.deletePrivBook($(this).parent().parent().attr("guid"));
            $(this).parent().parent().remove();
            return false;
        }
    });

    $("#server_books a.download").live('click', function() {
        popupMessage("正在从服务器下载 (服务器带宽有限，需要较长时间，请耐心等待)");
        var tr = $(this).parent().parent();
        $.get("/books/" + tr.attr("sid") + "?sn=" + sn,
            function(data){
                bb.replacePrivBookByRawData(tr.attr("guid"), data);
                $("tr[guid='" + tr.attr("guid") + "'] a.download").replaceWith("已有");
                bambook_changed = true;
            });
        return false;
    });

    $("#server_books a.download-share").live('click', function() {
        if(sn == "") {
            popupMessage("您需要先连接到Bambook才能下载");
            hideMessage();
        }else{
            popupMessage("正在从服务器下载 (服务器带宽有限，需要较长时间，请耐心等待)");
            var tr = $(this).parent().parent();
            $.get("/share_books/" + tr.attr("sid"),
                function(data){
                    bb.replacePrivBookByRawData(tr.attr("guid"), data);
                    $("tr[guid='" + tr.attr("guid") + "'] a.download-share").replaceWith("已有");
                    bambook_changed = true;
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
            function() {
                container.remove();
                bambook_changed = true;
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
            filterServerBooks();
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