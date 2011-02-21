//TODO show progress with XMLHTTP upload/download if possible
var bb = document.getElementById('bambookplugin');  
var sn = "";
var bambook_changed = true;
var jobs = [];
var currentJob = null;

$.template("bambook_book_template", "<tr guid='${guid}'><td>${name}</td><td>${author}</td><td>{{if uploaded}}已上传{{else}}<a href='#' class='upload'>上传</a>{{/if}} <a href='#' class='delete'>删除</a></td></tr>");
$.template("job_template", "<li><a href='#'>{{if upload}}上传{{else}}下载{{/if}} ${name}</a></li>");

function refreshBambookBooks() {
    $('#server_books').hide();
    if(bb.valid && bb.version >= "1.0.1") {
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
                    $.unblockUI();
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
        $.unblockUI();
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
        }
    })
}

function connect() {
    if(bb.version >= "1.0.5") {
        bb.connect($("#bambook_ip").val(), function(plugin, result){
            if(result == 0) {
                sn = bb.getDeviceInfo()["sn"];
                $('#box').hide();
                refreshBambookBooks();
            }else{
                updateMessage("连接错误: " + bb.getErrorString(result));
                setTimeout($.unblockUI, 1200);
            }
        });
    }else{
        var result = bb.connect($("#bambook_ip").val());
        if(result == 0) {
            sn = bb.getDeviceInfo()["sn"];
            $('#box').hide();
            refreshBambookBooks();
        }else{
            updateMessage("连接错误: " + result);
            setTimeout($.unblockUI, 1200);
        }
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

function refreshJobs() {
    if(jobs.length == 0) {
        $("#jobs").html("<li><a href='#'>无等待处理的任务</a></li>");
    }else{
        $("#jobs").html($.tmpl("job_template", jobs));
    }
}

function processJobs() {
    if(jobs.length > 0 && currentJob == null) {
        if(bb.getConnectStatus() != 0) {
            $("#sidebar div:first h3").html("任务队列 请先连接您的Bambook");
        }else{
            currentJob = jobs.shift();
            if(currentJob.upload) {
                bb.fetchPrivBookByRawData(currentJob.guid);
            }else{
                $("#sidebar div:first h3").html("任务队列 正在下载 (服务器带宽有限，需要较长时间，请耐心等待) <img src='/images/icons/ajax_loader.gif'/>");
                $.get((currentJob.share ? "/share_books/" : "/books/") + currentJob.sid + "?sn=" + sn,
                    function(data){
                        bb.replacePrivBookByRawData(currentJob.guid, data);
                    });
            }
        }
    }
}

addEvent('privbooktrans', function(state, progress, userdata){
    var message;
    if(state == 0) {
        message = "正在和Bambook传输: " + progress + " / 100";
    }else if(state == 1){
        if(currentJob.upload) {
            message = "正在上传 (服务器带宽有限，需要较长时间，请耐心等待) <img src='/images/icons/ajax_loader.gif'/>";
        }else{
            message = "";
            $("tr[guid='" + currentJob.guid + "'] span").replaceWith("已有");
            bambook_changed = true;
            currentJob = null;
            refreshJobs();
        }
    }else if(state == 2){
        message = "和Bambook传输失败, 请重试";
    }
    $("#sidebar div:first h3").html("任务队列 " + message);
});

addEvent('privbooktransbyrawdata', function(data){
    $.post("/books", {
        sn: sn,
        guid: currentJob.guid,
        name: currentJob.name,
        author: currentJob.author,
        data: data
    }, function() {
        $("#sidebar div:first h3").html("任务队列");
        $("tr[guid='" + currentJob.guid + "'] span").replaceWith("已上传");
        currentJob = null;
        refreshJobs();
    });
    
});

$(function() {
    $("#btn_connect").click(function() {
        popupMessage("正在连接到Bambook")
        connect();
        return false;
    });

    $("#bambook_books a.upload").live('click', function() {
        var tr = $(this).parent().parent();
        var job = {
            "upload": true,
            "guid": tr.attr("guid"),
            "name": tr.children()[0].innerHTML,
            "author": tr.children()[1].innerHTML
        };
        jobs.push(job);
        refreshJobs();
        $(this).replaceWith("<span>等待处理</span>");
        return false;
    });

    $("#bambook_books a.delete").live('click', function() {
        if(confirm("您确定要在Bambook上删除这本书吗？")) {
            bb.deletePrivBook($(this).parent().parent().attr("guid"));
            $(this).parent().parent().remove();
        }
        return false;
    });

    $("#server_books a.download").live('click', function() {
        var tr = $(this).parent().parent();
        var job = {
            "download": true,
            "share": $(this).hasClass("share"),
            "guid": tr.attr("guid"),
            "sid": tr.attr("sid"),
            "name": tr.children()[0].innerHTML
        };
        jobs.push(job);
        refreshJobs();
        $(this).replaceWith("<span>等待处理</span>");
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
        }
        return false;
    });

    $("#server_books a.public").live('click', function() {
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

    setInterval(processJobs, 1000);
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
