var json_questions_file;
var json_results_file;
var time_array = [2];
const QUESTION_ID = "question";
const RESULT_ID = "results";
const COOKIE_NAME = "quick_feed" ;
const TYPES= ["text","evaluation","free_buttons"];
const COOKIE_EXDAYS = 365;
const PRIORITY_MAX = 1;
const MATRIX_DIM = 50;
//load the framework when the document is ready
$(document).ready(function() {

    if ($("#" + QUESTION_ID).length > 0) {
        if (typeof $("#"+QUESTION_ID).attr('data-src') !== 'undefined') {
            //json queries request to server
            $.ajax ({
                url: $("#"+QUESTION_ID).attr('data-src'),
                datatype: "json",
                success: function (e) {
                    // Success callback
                    if (typeof e !== "string") {
                    json_questions_file = JSON.parse(JSON.stringify(e));
                    }
                    else json_questions_file = JSON.parse(e);
                },
                complete: function(jqXHR, textStatus){
                    loadFramework();
                }
            });
        }
        else {
            console.warn("quickFeed: attribute data-src not declared");
        }
    }
    else {
        console.warn("quickFeed: #"+QUESTION_ID+" div not declared");
    }
    //results
    if ($("#" + RESULT_ID).length > 0) {
        if (typeof $("#"+RESULT_ID).attr('data-src') !== 'undefined') {
            //json queries request to server
            $.ajax ({
                url: $("#"+RESULT_ID).attr('data-src'),
                datatype: "json",
                success: function (e) {
                    // Success callback
                    json_results_file = JSON.parse(JSON.stringify(e));
                    
                },
                complete: function(jqXHR, textStatus){
                    loadResults();
                }
            });
        }
        else {
            console.warn("quickFeed: attribute data-src is missing");
        }
    }
    else {
        console.warn("quickFeed: #"+RESULT_ID+" div is missing");
    }
});

//loading function
function loadFramework() {
    var errorFlag;

    try {
        //queries
        json_questions_file.queries.forEach(function(query) {
            if (query.id == null || query.type == null || query.question == null) {
                console.error("quickFeed: id, type or question are missing in the query n.: " +  (json_questions_file.queries.indexOf(query)+1));
                errorFlag = true;
            }
            if (!checkQueryType(query.type)) {
                console.error("quickFeed: " + query.type + " is not a valid query type");
                errorFlag = true;
            }
        });
    }
    catch (e) {
        console.error('quickFeed: ' + e + '\t -> is the JSON file correct?\n');
        return;
    }
    if (errorFlag) return;
    var cookies = checkCookie();
    cookies.forEach(function(cookie) {
        //if a cookie (an id) is present then pop it
        json_questions_file.queries.forEach(function(query) {
            if (query.id === cookie) {
                var index = json_questions_file.queries.indexOf(query);
                if (index > -1) {
                    json_questions_file.queries.splice(index, 1);
                }
            }
        });
    });
    // if priority is undefined then initialize it with PRIORITY_MAX
    json_questions_file.queries.forEach(function(element) {
        if (typeof element.priority == 'undefined') {
            element.priority = PRIORITY_MAX;
        }
    });
    //select and create the query
    (json_questions_file.queries.length > 0) ? createQuery(selectQuery(json_questions_file.queries),$("#" + QUESTION_ID)) : null;
    
    //time spent
    if (json_questions_file.time != "undefined" && json_questions_file.time == true) {
        time_array[0] = new Date();
        window.onbeforeunload = function(event) {
            time_array[1] = new Date();
            time_spent = parseInt((time_array[1].getTime() - time_array[0].getTime())/1000);
            var log = "quickFeed: time-spent: ";
            $.ajax({
                type: "POST",
                url: "/time_spent",
                data: {
                    time: time_spent,
                    browser: browser(),
                    URLPath: window.location.pathname
                },
                error: function() {
                    console.log(log + " error");
                },
                success: function(data,textStatus,jqXHR ) {
                    console.log(log + "success \t data: " + data);
                }
            });
        }
    }

    var $document = $(document);
    var cellDimWidth = $document.width()/MATRIX_DIM;
    var cellDimHeight = $document.height()/MATRIX_DIM;
    var type;
    if ( $document.width() >= 992) {
        type = 'desktop';
    }
    else if ( $document.width() >= 768) {
        type = 'tablet';
    }
    else {
        type = 'mobile';
    }
    //click
    if (json_questions_file.mouse_click != "undefined" && json_questions_file.mouse_click == true) {
        
        document.addEventListener("click", function(event){
            var log = "quickFeed: click: ";
            $.ajax({
                type: "POST",
                url: "/click_track",
                data: {
                    clickX: parseInt(event.clientX/cellDimWidth),
                    clickY:parseInt(event.clientY/cellDimHeight),
                    screen_type: type,
                    URLPath: window.location.pathname
                },
                error: function() {
                    console.log(log + " error");
                },
                success: function(data,textStatus,jqXHR ) {
                    console.log(log + "success \t data: " + data);
                }
            });
        }); 
        
    }
    //over
    if (json_questions_file.mouse_over != "undefined" && json_questions_file.mouse_over == true) {
        var timeFlag = true;
        var milliseconds = (new Date()).getTime();
        var overX, overY;
        var mouseleaved;
        document.addEventListener("mousemove", function(event){
            if (milliseconds/1000 < ((new Date()).getTime())/1000-1)  {
                timeFlag = true;
                milliseconds = (new Date()).getTime();
            }
            if (timeFlag) {
                timeFlag = false;
                overX = parseInt(event.clientX/cellDimWidth);
                overY = parseInt(event.clientY/cellDimHeight);
            }
            mouseleaved = false;
        });
        document.addEventListener("mouseleave", function(event){
            mouseleaved = true;
        });
        setInterval(
            
            function() {
                if (!mouseleaved) {
                    var log = "quickFeed: over: ";                
                    $.ajax({
                        type: "POST",
                        url: "/over_track",
                        data: {
                            overX: overX,
                            overY: overY,
                            screen_type: type,
                            URLPath: window.location.pathname
                        },
                        error: function() {
                            console.log(log + " error");
                        },
                        success: function(data,textStatus,jqXHR ) {
                            console.log(log + "success \t data: " + data);
                        }
                    });
                }
            },
            1000);      
    }


}
//queries are compared by priority
function queriesComparator(a,b) {
    if (a.priority < b.priority)
        return -1;
    if (a.priority > b.priority)
        return 1;
    return 0;
}

//results 
function loadResults() {
    Builder.results($('.answers-container'),json_results_file);
}
//check for the browser
var browser = function() {
    // Return cached result if avalible, else get result then cache it.
    if (browser.prototype._cachedResult)
        return browser.prototype._cachedResult;
    // Opera 8.0+
    var isOpera = (!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
    // Firefox 1.0+
    var isFirefox = typeof InstallTrigger !== 'undefined';
    // Safari 3.0+ "[object HTMLElementConstructor]" 
    var isSafari = /constructor/i.test(window.HTMLElement) || (function (p) { return p.toString() === "[object SafariRemoteNotification]"; })(!window['safari'] || safari.pushNotification);
    // Internet Explorer 6-11
    var isIE = /*@cc_on!@*/false || !!document.documentMode;
    // Edge 20+
    var isEdge = !isIE && !!window.StyleMedia;
    // Chrome 1+
    var isChrome = !!window.chrome && !!window.chrome.webstore;
    // Blink engine detection
    var isBlink = (isChrome || isOpera) && !!window.CSS;

    return browser.prototype._cachedResult =
        isOpera ? 'Opera' :
        isFirefox ? 'Firefox' :
        isSafari ? 'Safari' :
        isChrome ? 'Chrome' :
        isIE ? 'IE' :
        isEdge ? 'Edge' :
        isBlink ? 'Blink' :
        "N/A";
};
//select a query from an array (queries) . the selection is based on the priority of the query, if 2 or more queries have the max priority then one is choose randomly
function selectQuery(queries) {
    queries = queries.sort(queriesComparator).reverse();
    var priority = queries[0].priority;
    var selectedQueries =  [];
    var i = 0;
    while (i<queries.length && queries[i].priority === priority) {
        selectedQueries.push(queries[i]);
        i++;
    } 
    var index = Math.floor(Math.random()*(selectedQueries.length));
    return selectedQueries[index];
}

//create the query (all of it)
function createQuery (query,element) {
    
   Builder.container(element);
   
   Builder.question($('.question-container'),query.question);
   Builder.answer($('.question-container'),query);
}

function checkQueryType(type) {
    var found = false;
    TYPES.forEach(function(i) {
        if (type == i) {
            found = true;
        }
    });
    return found;
}

function setCookie(cvalue) {
    var d = new Date();
    d.setTime(d.getTime() + (COOKIE_EXDAYS * 24 * 60 * 60 * 1000));
    var expires = "expires="+d.toUTCString();
    document.cookie = COOKIE_NAME + "=" + checkCookie().toString() + ',' + cvalue + ";" + expires + ";path=/";

}

function checkCookie() {
    var question = getCookie(COOKIE_NAME);
    return question.split(','); //id's are comma separated
} 

function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

//this class build and handle the events for a question
class Builder {

    //build the container and the elements for the framework
    static container(element) {
        var container = document.createElement('div');
        var $container = $(container);
        $container.addClass("col-lg-12 col-md-12 col-sm-12 col-xs-12 question-container panel panel-default")
            .appendTo($(element));
        
        $(document.createElement('div'))
            .addClass("question text-center panel-heading")
            .appendTo($container);
        $(document.createElement('br'))
            .appendTo($container);
        $(document.createElement('div'))
            .addClass("answer panel-body")
            .css('text-align','center')
            .appendTo($container);
        $(document.createElement('div'))
            .addClass("submit-button")
            .appendTo($container);
        $(document.createElement('div'))
            .addClass("disclaimer")
            .appendTo($container); 
        $(document.createElement('a'))
            .addClass("info")
            .appendTo($container);
    }
    //defines the query
    static question(element, question) {
        element.children('.question').html(question);
    }
    /**
     * defines the answer, types are listed below:
     * 1. evaluation : evaluation will be min to max (ex. 1 to 10, 1 to 5 ecc), max buttons = 12
     * 2. text : the answer is a free text
     * 3. free_buttons : buttons can be any text (max. 18 char), max buttons = 12
     */ 
    static answer(element,question) {
        switch (question.type) {
            case ('evaluation') : {
                var min;
                var max;
                if (question.options.min == null) {
                    min = 1;
                }
                else {
                    min = question.options.min ;
                }
                if (question.options.max == null) {
                    max = min+4;
                }
                else {
                    max = question.options.max ;
                }
                $(document.createElement('div'))
                    .appendTo(element.children('.answer'));
                for (var i=min; i<=max; i++) {
                    var button = document.createElement('button');
                    $(button)
                        .addClass('btn btn-'+i)
                        .css('width','7%')
                        .css('margin','0 1%')
                        .attr('type','button')
                        .html(i)
                        .appendTo(element.children('.answer'));     
                    //event listen for buttons, they are submiters
                    button.addEventListener("click",function(ev) {
                        var button = $(this);
                        console.log(button.html());
                        $.ajax({
                            type: "POST",
                            url: "/answer",
                            data: {
                                value: button.html(),
                                id : question.id,
                                type: question.type
                            },
                            
                            error: function() {
                                console.log("error");
                            },
                            success: function(data,textStatus,jqXHR ) {
                                console.log("success \t data: " + data);
                                $(".question-container").hide("fast");
                                setCookie(question.id);
                                
                            }
                        });
                    });
                } 
            } break;
            case ('text') : {
                //setting the text element
                $(document.createElement('div'))
                    .appendTo(element.children('.answer'));
                var input = document.createElement('textarea');
                $(input)
                    .addClass('form-control')
                    .attr('rows','4')
                    .attr('name','answer')
                    .attr('placeholder','...')
                    .appendTo(element.children('.answer'));
                //setting the submit button
                var submit = document.createElement('button');
                $(document.createElement('br')).appendTo(element.children('.answer'));
                $(submit)
                    .addClass('btn btn-submit')
                    .html('submit')
                    .appendTo(element.children('.answer'));
            
                submit.addEventListener("click",function(ev) {
                    var button = $(this);
                    console.log(button.html());
                    $.ajax({
                        type: "POST",
                        url: "/answer",
                        data: {
                            value: input.value,
                            id : question.id,
                            type: question.type
                        },
                        
                        error: function() {
                            console.log("error");
                        },
                        success: function(data,textStatus,jqXHR ) {
                            console.log("success \t data: " + data);
                            $(".question-container").hide("fast");
                            setCookie(question.id);
                            
                        }
                    });
                });
            } break;
            case ('free_buttons') : {
                var buttonsText = question.options.buttons;
                $(document.createElement('div'))
                    .appendTo(element.children('.answer'));
                for (var i=0; i<buttonsText.length; i++) {
                    var button = document.createElement('button');
                    $(button)
                        .addClass('btn btn-'+i)
                        .css('width','7%')
                        .css('margin','0 1%')
                        .attr('type','button')
                        .html(buttonsText[i])
                        .appendTo(element.children('.answer'));     
                    //event listen for buttons, they are submiters
                    button.addEventListener("click",function(ev) {
                        var button = $(this);
                        console.log(button.html());
                        $.ajax({
                            type: "POST",
                            url: "/answer",
                            data: {
                                value: button.html(),
                                id : question.id,
                                type: question.type
                            },
                            
                            error: function() {
                                console.log("error");
                            },
                            success: function(data,textStatus,jqXHR ) {
                                console.log("success \t data: " + data);
                                $(".question-container").hide("fast");
                                setCookie(question.id);
                                
                            }
                        });
                    });
                } break;
            }
            default: {
            }
        }
    }

    static results(element,results) {
        var answers = results.answer;
        var container = document.createElement('table');
        var tbodyText= element.children("#text-answers").children("tbody");
        var tbodyEvaluation= element.children("#evaluation-answers").children("tbody");
        var tbodyFreeButton= element.children("#free-buttons-answers").children("tbody");
        var maxText = 1;
        var maxEvaluation = 1;
        var maxFreeButtons = 1;
        results.answer.forEach(function(element) {
            if (element.type === "text") { 
                var maxText = 1;
                var totalText = 0;
                element.values.forEach(function(value) {
                    value.value>maxText ? maxText = value.value : null ;
                    totalText+=value.value;
                });      
                element.values.forEach(function(value) {         
                    var row = document.createElement('tr');
                    $(row).appendTo($(tbodyText));
                    $(document.createElement('td'))
                        .html(element.id)
                        .appendTo($(row));
                    $(document.createElement('td'))
                        .html(value.key)
                        .appendTo($(row));
                    $(document.createElement('td'))
                        .html("<div id='myProgress'><div style='height: 30px;background-color: #4CAF50; width:"+ (value.value/totalText*100) +"%;'></div></div>")
                        .appendTo($(row));
                });
            }
            if (element.type === "evaluation") { 
                var maxEvaluation = 1;
                var totalEvaluation = 0;
                element.values.forEach(function(value) {
                    value.value>maxEvaluation ? maxEvaluation = value.value : null ;
                    totalEvaluation+=value.value;
                });      
                element.values.forEach(function(value) {         
                    var row = document.createElement('tr');
                    $(row).appendTo($(tbodyEvaluation));
                    $(document.createElement('td'))
                        .html(element.id)
                        .appendTo($(row));
                    $(document.createElement('td'))
                        .html(value.key)
                        .appendTo($(row));
                    $(document.createElement('td'))
                        .html("<div id='myProgress'><div style='height: 30px;background-color: #4CAF50; width:"+ (value.value/totalEvaluation*100) +"%;'></div></div>")
                        .appendTo($(row));
                });
            }
            if (element.type === "free_buttons") {
                var maxFreeButtons = 1;
                var totalFreeButtons = 0;
                element.values.forEach(function(value) {
                    value.value>maxFreeButtons ? maxFreeButtons = value.value : null ;
                    totalFreeButtons+=value.value;
                });      
                element.values.forEach(function(value) {         
                    var row = document.createElement('tr');
                    $(row).appendTo($(tbodyFreeButton));
                    $(document.createElement('td'))
                        .html(element.id)
                        .appendTo($(row));
                    $(document.createElement('td'))
                        .html(value.key)
                        .appendTo($(row));
                    $(document.createElement('td'))
                        .html("<div id='myProgress'><div style='height: 30px;background-color: #4CAF50; width:"+ (value.value/totalFreeButtons*100) +"%;'></div></div>")
                        .appendTo($(row));
                });
            }
        });        
            results.path.forEach(function (path) {
                path.clicks.forEach(function (element) {
                    var c = document.createElement('canvas');
                    var ctx = c.getContext('2d');
                    var canvasWidth = 400;
                    var canvasHeight = 400;
                   

                    c.width = canvasWidth;
                    c.height = canvasHeight;
                    
                    var indexC = 0;
                    var max=0;
                    
                    element.clickMatrix.forEach(function (row) {
                        row.forEach(function (col) {
                            max<col ? max=col : null;
                        });
                    });
                    switch (element.screen_size) {
                        case 'desktop': 
                        if (document.getElementById('desktop-capture') != null){
                            $(document.createElement('h4'))
                            .html('desktop')
                            .appendTo(document.getElementsByClassName('clicks-container'));
                            ctx.drawImage(document.getElementById('desktop-capture'), 0,0,canvasWidth,canvasHeight);
                        
                            $(c).appendTo($('.clicks-container'));
                            
                        }
                            
                            break;
                        case 'tablet' :
                            if (document.getElementById('tablet-capture') != null) {
                                $(document.createElement('h4'))
                                    .html('tablet')
                                    .appendTo(document.getElementsByClassName('clicks-container'));
                                ctx.drawImage(document.getElementById('tablet-capture'), 0,0,canvasWidth,canvasHeight);            
                                $(c).appendTo($('.clicks-container'));
                            
                            }
                            break;  
                        case 'mobile' :
                            if (document.getElementById('mobile-capture') != null)  {
                                $(document.createElement('h4'))
                                    .html('mobile')
                                    .appendTo(document.getElementsByClassName('clicks-container'));
                                ctx.drawImage(document.getElementById('mobile-capture'), 0,0,canvasWidth,canvasHeight);
                                $(c).appendTo($('.clicks-container'));      
                            }
                            break;
                        default : return;
                    }
                    element.clickMatrix.forEach( function (row) {
                        var indexR = 0;
                        row.forEach(function (col) {
                            if (col != 0) {
                                var color = parseInt(col/max*255);
                                var shadow = 0.8*col/max+0.2;
                                // Create gradient
                                var grd = ctx.createRadialGradient(indexC*8+4,indexR*8+4,4,indexC*8+4,indexR*8+4,8);
                                grd.addColorStop(0,'rgba('+255+',0,0,'+shadow+')');
                                grd.addColorStop(1,"white");

                                // Fill with gradient
                                ctx.fillStyle = grd;            
                                ctx.fillRect(indexC*8,indexR*8,8,8);     
                            }
                            
                            indexR++;
                        });
                        indexC++;
                    });
                    $(document.createElement('br')).appendTo($('.clicks-container'));
                    
                })
                path.over.forEach(function (element) {
                    var c = document.createElement('canvas');
                    var ctx = c.getContext('2d');
                    var canvasWidth = 400;
                    var canvasHeight = 400;
                   

                    c.width = canvasWidth;
                    c.height = canvasHeight;
                    
                    var indexC = 0;
                    var max=0;
                    
                    element.overMatrix.forEach(function (row) {
                        row.forEach(function (col) {
                            max<col ? max=col : null;
                        });
                    });
                    switch (element.screen_size) {
                        case 'desktop': 
                        if (document.getElementById('desktop-capture') != null)  {
                            $(document.createElement('h4'))
                                    .html('desktop')
                                    .appendTo(document.getElementsByClassName('over-container'));
                            ctx.drawImage(document.getElementById('desktop-capture'), 0,0,canvasWidth,canvasHeight);
                                    
                            $(c).appendTo($('.over-container'));
                        }                   
                            break;
                        case 'tablet' :
                            if (document.getElementById('tablet-capture') != null) {
                                $(document.createElement('h4'))
                                    .html('tablet')
                                    .appendTo(document.getElementsByClassName('over-container'));
                                ctx.drawImage(document.getElementById('tablet-capture'), 0,0,canvasWidth,canvasHeight);
                                    
                                $(c).appendTo($('.over-container'));
                            }
                            break;  
                        case 'mobile' :
                            if (document.getElementById('mobile-capture') != null)  {
                                $(document.createElement('h4'))
                                    .html('mobile')
                                    .appendTo(document.getElementsByClassName('over-container'));
                                ctx.drawImage(document.getElementById('mobile-capture'), 0,0,canvasWidth,canvasHeight);      
                                
                                $(c).appendTo($('.over-container'));                              
                            }
                            break;
                        default : return;
                    }

                    
                    element.overMatrix.forEach( function (row) {
                        var indexR = 0;
                        row.forEach(function (col) {
                            if (col != 0) {
                                var color = parseInt(col/max*255);
                                var shadow = 0.8*col/max+0.2;
                                // Create gradient
                                var grd = ctx.createRadialGradient(indexC*8+4,indexR*8+4,4,indexC*8+4,indexR*8+4,8);
                                grd.addColorStop(0,'rgba('+255+',0,0,'+shadow+')');
                                grd.addColorStop(1,"white");

                                // Fill with gradient
                                ctx.fillStyle = grd;            
                                ctx.fillRect(indexC*8,indexR*8,8,8);     
                            }
                            
                            indexR++;
                        });
                        indexC++;
                    });
                    $(document.createElement('br')).appendTo($('.over-container'));
                    
                })
            })
        
    }

}