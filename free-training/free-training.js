/*
 * Base functionality. Do not instantiate directly.
 */
function BlogView() {

    this.loadBlog = function (callback) {
        showLoading();

        var handleData = function (data) {
            callback(data);

            hideLoading();
        };

        var handleError = function (error) {
            console.log(error);
        };

        bc.core.getData("about", handleData, handleError);
    };

    var showLoading = function () {
        document.getElementById("loading").style.opacity = 1;
    };

    var hideLoading = function () {
        document.getElementById("loading").style.opacity = 0;
    };

    //var setting;



}



/*
 * Factory method for returning phone view or blog view.
 */
BlogView.factory = function () {
    return getDeviceType() === "phone" ? new PhoneBlogView() : new TabletBlogView();
};

function getDeviceType() {
    return window.matchMedia("(max-width: 650px)").matches ? "phone" : "tablet";
}

var handleData = function (data) {
    var template = bc.templates["tablet-tmpl"];
    var context = { "Data": data };
    var markup = Mark.up(template, context);

    document.getElementById("index-page-template").innerHTML = markup;
};



/*
 * Phone functionality.
 */
function PhoneBlogView() {

    this.init = function () {
        this.loadBlog(handleData);

        $("li").live("tap", function (evt) {
            console.log("tapped phone item!");
        });
    };

}

PhoneBlogView.prototype = new BlogView();






/*
 * Tablet functionality.
 */
function TabletBlogView() {

    this.init = function () {
        this.loadBlog(handleData);

        registerEventListeners();  

        if (getSession() == true) {
            loadContent();
        }
        else {
            showLoginForm();
        }

        //$("body").on("tap", "#logout-button", this.logout);      
        
    };   

    // authenticate the user
    this.login = function () {
        var creds = getFormCredentials();
        var opts = {
                data: {
                    "app_id" : APP_ID,
                    "api_key" : API_KEY,
                    "data": JSON.stringify(getFormCredentials())
              
                }
            };

        // proceed only if both fields have values
        if (OAPcreds.username && OAPcreds.password) {
            showLoading();

            bc.device.postDataToURL(AUTH_URL, handleAuthResponse, handleAuthError, opts);
        }
    };

    var registerEventListeners = function () {

        // listen for an article tap
        $(".featured").live("tap", function (evt) {
            var guid = evt.currentTarget.getAttribute("data-guid");
            var article = getArticle(guid);

            renderArticleDetail(article);

            startContentSession(article);
        });

        // listen for the settings button tap
        $(".settings-button").live("tap", function (evt) {
            loadSettings();

        });

        // listen for the logout button tap
        $("#logout-button").live("tap", function (evt) {
            logout();

        });

        // listen for a "back" tap
        $(".back-button").live("tap", function (evt) {
            bc.ui.backPage();

        });

        
    };

    var loadSettings = function (data) {
        var template = bc.templates["tablet-settings-tmpl"];
        var context = { "settings": data };
        var markup = Mark.up(template, context);

        //document.getElementById("settings-page-template").innerHTML = template;

        var page = document.getElementById("settings-page");
        bc.ui.forwardPage(page);
    };

};

// Login stuff

login = function () {
    var creds = getFormCredentials();
    var opts = {
            data: {
                "app_id" : APP_ID,
                "api_key" : API_KEY,
                "data": JSON.stringify(getFormCredentials())
          
            }
        };

    // proceed only if both fields have values
    if (OAPcreds.username && OAPcreds.password) {
        showLoading();

        bc.device.postDataToURL(AUTH_URL, handleAuthResponse, handleAuthError, opts);
    }
};


hello = function () { 
        console.log("hello!");
    }

    var AUTH_URL = "https://www1.moon-ray.com/api.php/json/pilotpress/authenticate_user";
    var APP_ID = "2_5668_IQnWI95eM";
    var API_KEY = "M7UGtKCkX2gHkan";

    // initialize this view
    /*this.init = function () {
        if (getSession() == true) {
            loadContent();
        }
        else {
            showLoginForm();
        }

        $("body").on("tap", "#logout-button", this.logout);
    };*/

    

    // expire the user's authentication token and display the login form
logout = function () {
        var auth = bc.core.cache("auth");
        auth.expires = 0;

        bc.core.cache("auth", auth);

        showLoginForm();
    };

    // get the username and password from the form fields
    var getFormCredentials = function () {

         OAPcreds = new Object();

            OAPcreds.site = "http://www.danijohnson.com";
            OAPcreds.username = $("#username").val();
            OAPcreds.password = $("#password").val();

        return OAPcreds;
    };

    // handle a valid response from the authentication request
    var handleAuthResponse = function (data) {
        
        // save the response in the cache and while we are at it, let's get rid of the extra object layer .pilotpress 
        response = JSON.parse(data);
        bc.core.cache("auth", response);
        bc.core.cache("user", response.pilotpress);

        // error reporting
        response = bc.core.cache("auth");

            // did we get an error response back?
            if (response.type == "error") {

                showLoginWarning();
            }

            // successful?
            else {
                // put the user info into an object, for, you know... stuff...
                user = bc.core.cache("user");
                
                // log them in 
                createSession();
                
            }

        // was it successful?
        if (getSession() == true ) {
            // if so, proceed
            loadContent();
        }
        else {
            // otherwise try again
            console.log("No content for you!")
            hideLoading();
        }
    };

    // handle a comms error from the authentication request
    var handleAuthError = function () {
        var errorMessage = "Something went really, really wrong."
        $("#warning").fadeOut().empty().html(errorMessage).fadeIn();
        hideLoading();
        console.log("What the HELL did you break?!")
    };
    
    // let's set say that you're logged in
    var createSession = function () {
        var auth = bc.core.cache("auth");
        // how we know they logged in and have access
        var now = new Date().getTime();
        var expireDate = (now + 7 * 24 * 60 * 60 * 1000);

        // let's add the expiration date to the authetication object
        auth.expires = expireDate;
        bc.core.cache("auth", auth);
    }

    // show a warning on failed login
    var showLoginWarning = function () {

            // is the error this?
            if (response.message == "Invalid Account") {
                // message readable
                response.message_r = "Oh no, we seem to be having some issues... Try again later :(" ;
                console.log(response.message);
            }

            // or is the error this?
            else if (response.message == "Invalid API Key") {
                // message readable
                response.message_r = "Oh no, we seem to be having some issues... Try again later :(" ;
                // let me know
                console.log(response.message);
            }

            // or is the error this?
            else if (response.message == "Authentication Error") {
                // message readable
                response.message_r = "Wrong username or password" ;
                // let me know
                console.log(response.message);
            }

            // if it's none of those, at least says something...
            else {
                // message readable
                response.message_r = "Something went wrong..." ;
                // let me know
                console.log(response.message);
            };

        $("#warning").fadeOut().empty().html(response.message_r).fadeIn();
        hideLoading();

    };

    // get a valid authentication token from the cache, or return null
    var getSession = function () {
        var auth = bc.core.cache("auth") || {};
        var now = new Date().getTime();
        
        // if not expired
        if (auth !== null) {
           if (auth.expires > now) {
                return true;
            }

            return false;
        }
        
        return false;

    };

    // get the user's username from the cache, or return an empty string
    var getUsername = function () {
        var user = bc.core.cache("user") || {};

        return user.email || "";
    };

    // does the user have a valid token?
    var loggedIn = function () {
        //return getToken() !== null;
    };

    // display the login form with the current username (if exists)
    var showLoginForm = function () {
        var template = bc.templates["tablet-login-tmpl"];
        var context = {
            "username": getUsername()
        }; 

        var markup = Mark.up(template, context);

        $("#settings-page-template").html(markup);
        $("#logout-button").hide();

        // TODO move into bc.ui
        //Scrollbox.get("content-scroll").top();
    };

    // load content from server
    var loadContent = function () {

        var template = bc.templates["tablet-settings-tmpl"];
            var context = {
                "username": getUsername()
            };
            var markup = Mark.up(template, context);

            $("#settings-page-template").html(markup);

            // TODO move into bc.ui
            //Scrollbox.get("content-scroll").top();
        
        hideLoading();

        $("#logout-button").show();

        console.log("This is me, showing you content.")
        /* old stuff
        var url = DATA_URL + "?token=" + getToken();

        // make sure the user's token is still valid
        if (loggedIn()) {
            showLoadingMessage();

            bc.device.fetchContentsOfURL(url, handleContentResponse, handleContentError);
        }
        // otherwise kick out
        else {
            bc.device.alert("Oh noes! Your session expired. Please log in again.");

            showLoginForm();
        } */ 
    };
 
     // handle data from a content request
    var handleContentResponse = function (data) {
        hideLoading();

        try {
            // in the Workshop, parse the response
            data = JSON.parse(data);
        }
        catch (e) {
        }

        // for good measure
        if (data.authorized === false) {
            bc.device.alert("No content for you!");
            return;
        }

        var template = bc.templates["results-template"];
        var context = { "results": data };
        var markup = Mark.up(template, context);

        $("#content").html(markup);
        $("#logout-button").show();
    };
/*
    // handle a comms error from a content request
    var handleContentError = function (error) {
        bc.device.alert(error.errorMessage);
    };

    // show the "loading" message
    var showLoadingMessage = function () {
        $("#loading").css("opacity", 1);
    };

    // hide the "loading" message
    var hideLoadingMessage = function () {
        setTimeout(function () {
            $("#loading").css("opacity", 0);
        }, 500);
    };
*/
    var showLoading = function () {
        document.getElementById("loading").style.opacity = 1;
    };

    var hideLoading = function () {
        document.getElementById("loading").style.opacity = 0;
    };

TabletBlogView.prototype = new BlogView();