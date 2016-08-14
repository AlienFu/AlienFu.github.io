var Chegg = Chegg || {};
Chegg.component = Chegg.component || {};

/**
 * CheckAvailbility - a factory to return CheckAvailbility view objects.
 * Each new object will work with only the nodes inside of it.
 * required:
 *    input[name=username] - this is the username to check
 *    #chg-balloon-submit - an element with this id. a click event will be listened for
 *
 * Optional
 *    <suggestions> - if present a list of suggested usernames will be replaced if a
 *    the user specified username is already taken
 *    <error-text> - this tag will be used to place error messages.
 *    <results-text> - this tag will be used to place results of the CheckAvailbility
 *
 * @return CheckAvailbilityView
 */
Chegg.component.CheckAvailbility = (function($) {

    /**
     * the regex to find invalid usernames. This is outside of the Component
     * so that the regex is only complied once. increasing performance.
     */
    var invalid_username_regex = /[\W]/;

    /**
     * Component - called at the bottom. This is the function called to instatiate new CheckAvailbility
     * views
     *
     * @param  {type} element either the jquery object or select of the node to use.
     */
    function Component(element) {


        /**
         * element can either be a jquery selector or jqueyr object.
         * this allows either to work.
         */
        this.$ele = $(element);


        /**
         * attach to the button.
         * TODO: use something thing other then an id. This way there can be more then onc
         * on the page. Which can happen if it isa one page app or differnt lightboxes.
         *
         */
        this.$ele.on("click", "#chg-balloon-submit", $.proxy(this.handleSubmit, this));


        /**
         * <check-results> - they contain for the suggestions and messaging.
         */
        this.$results = this.$ele.find("check-results");

        /**
         * <results-text> is wher the messaging for the avalaible check goes.
         */
        this.$results_text = this.$ele.find("results-text");

        /**
         * <error-text> is where error messaging goes. Stuff like invalid username, empty username
         * server errors.
         */
        this.$error_text = this.$ele.find("error-text");


        /**
         * the input element for the username.
         */
        this.$input = this.$ele.find("input[name=username]");


        /**
         * <suggestions> - if this is present the create a usernameSuggestion object
         * this is what handles displaying and checking username suggestions.
         */
        var suggestions = this.$ele.find("suggestions");
        if (suggestions.length) {

            this.suggestionComp = Chegg.component.UsernameSuggestion(suggestions);


            /**
             * suggestions triggers a username_selected event if the user clicks on a suggestions
             * listen to that event and then update the input box to show the selectiong.
             */
            this.suggestionComp.events.on("username_selected", $.proxy(this.handleUsernameSelected, this));
        }


        /**
         * lo-dash templates - these follow the mustasche format but we don't need the full implementation.
         * to define a template in the html:
         * <script type="templates/lodash" id="template_name">html</script>
         *
         * the html in the script tag is used as the template
         * TODO: get the template to be precompiled javascript. Can use grunt
         */
        this.templates = {};


        /**
         * template username_taken - this is the message to display to the user when a username they have
         * is not avalaible
         */
        this.templates.username_taken = _.template($("#username_taken").html());

        /**
         * tempalte username_available - message to show the user when they can use  the username
         */
        this.templates.username_available = _.template($("#username_available").html());

        /**
         * template to show the error messages
         *
         */
        this.templates.error_text = _.template($("#error_text").html());


        /**
         * cache the proxy functions for the ajax calls, this we we don't have
         * to keep recreating them for every check.
         */
        this.proxies = {};
        this.proxies.checkDone = $.proxy(this.handleCheckDone, this);
        this.proxies.checkError = $.proxy(this.handleCheckError, this);

    }


    /**
     * Component.prototype.handleUsernameSelected
     * handles trigged event from the username suggestion Component.
     * update the input value with the selected username.
     *
     * @param  jQuery Event event description
     * @param  {type} obj.username   the username the user selected.
     */
    Component.prototype.handleUsernameSelected = function(event, obj) {
        this.$input.val(obj.username);
    }

    /**
     * Component.prototype.handleCheckError - called with the username service comes back with an error.
     *
     * @param  {type} data description
     * @return {type}      description
     */
    Component.prototype.handleCheckError = function(data) {
        this.setErrorText("Something has gone wrong! Please try again later.");
    }

    /**
     * Component.prototype.handleCheckDone - called when the service returns data.
     * data should be in the format of:
     * [{"username":"Hillary2016","id":4791423}]
     * where each username is already taken
     *
     * @param  {Array} data description
     * @return {type}      description
     */
    Component.prototype.handleCheckDone = function(data) {


        /**
         * if - username wasn't taken
         *
         * @param  {type} !data.length a length of 0 means that the username is avalaible
         * @return {type}              description
         */
        if (!data.length) {

            /**
             * use the template and username we checked to let the user know
             * it is avalaible
             */
            this.$results_text.html(this.templates.username_available({
                username: this.checking_username
            }));

            /**
             * clear the suggestions. just making sure it is clear
             */

            if (this.suggestionComp) {
                this.suggestionComp.clear();
            }
        } else {

            /**
             * the username was taken.
             * show the user a message saying that.
             */
            this.$results_text.html(this.templates.username_taken({
                username: this.checking_username
            }));

            /**
             * if - the UI wants suggestions
             *
             * @param  {type} this.suggestionComp is the suggestion Component defined
             *  meaning the UI wants suggestions
             * @return {type}                     description
             */
            if (this.suggestionComp) {

                /**
                 * send the username to the suggestion Componentand have it make suggestions
                 * and make sure those suggestions are avalaible
                 *
                 */
                this.suggestionComp.updateSuggestion(this.checking_username);
            }
        }
    }


    /**
     * Component.prototype.isValidUsername - check a username and make sure it is valid.
     * this is where to add any checks to validate a username before sending it to the server.
     *
     *
     * @param  {String} username username to check
     * @return {type}          description
     */
    Component.prototype.isValidUsername = function(username) {

        if (invalid_username_regex.test(username)) {
            return false;
        }
        return true;
    }


    /**
     * Component.prototype.setErrorText -
     * use the error text teamplate and set the UI error text.
     * @param  {String} text description
     * @return {type}      description
     */
    Component.prototype.setErrorText = function(text) {

        this.$error_text.html(this.templates.error_text({
            text: text
        }));
    }

    /**
     * Component.prototype.resetUI - reset the messages and suggestions
     * start with a clean slate
     * @return {type}  description
     */
    Component.prototype.resetUI = function() {
        this.suggestionComp.clear();
        this.$results_text.html('');
        this.$error_text.html('');
    }

    /**
     * Component.prototype.handleSubmit - called when
     * the user clicks on the Check Verify button.
     *
     * @param  {jquery event} event description
     * @return {type}       description
     */
    Component.prototype.handleSubmit = function(event) {


        /**
         * get the username to check form
         */
        var username = this.$input.val();


        /**
         * cache the username, this way we know what user name was checked
         * when the service returns. There is always a chance the user will change the input
         * while the server is being checked.
         */
        this.checking_username = username;

        this.resetUI();

        /**
         * if - the user entered a username
         * if not show error message
         * @param  {string} username description
         * @return {type}          description
         */
        if (username) {



            /**
             * if the username is valid then call the service and validate
             * if not show an error message.
             */
            if (this.isValidUsername(username)) {
                Chegg.services.usernames.checkUsernames(username).done(this.proxies.checkDone).error(this.proxies.checkError);
            } else {
                this.setErrorText("Invalid username. Please only use letters and numbers");
            }
        } else {
            this.setErrorText("Please enter a username");

        }
    }


    /**
     * return - return function factory 
     *
     * @param  {type} ele description
     * @return {type}     description
     */
    return function(ele) {

        return new Component(ele);
    }

})(jQuery);

var Chegg = Chegg || {};
Chegg.component = Chegg.component || {};


/**
 * Chegg.component.UsernameSuggestion - a compont factory to handle username suggestions
 *
 *
 * @param  {type} function($ description
 * @return {type}            description
 */
Chegg.component.UsernameSuggestion = (function($) {

    /**
     * Set lo-dash templating to use {{value}} style interpolation.
     */
    _.templateSettings.interpolate = /{{([\s\S]+?)}}/g;


    /**
     * remove the trailing number from a username
     * then a postfix will be added after
     */
    var trailing_numbers_regex = /\d*$/;
    /**
     * categories is used for generating usernames. the developer can specify what category
     * to start with. The idea is to have the category have postFixes and preFixes
     * to add to the username for generating new ones.
     * TODO: add more categories
     */

    var categories = {
        "fantasy": {
            postFixes: [
                "TheFeared",
                "TheBard",
                "TheJester",
                "IsComing",
                "TheDark",
                "TheDragon",
                "TheElf",
                "TheDwarf",
                "TheHunter",
                "TheRed",
                "TheWhite",
                "TheBlack"

            ]
        },
        'default': "fantasy"

    };
    /**
     * Component - called at the bottom. This is the function called to instatiate new UsernameSuggestion
     * views
     *
     * @param  {type} element either the jquery object or select of the node to use.
     */
    function Component(element) {
        var component = this;
        /**
         * element can either be a jquery selector or jqueyr object.
         * this allows either to work.
         */
        this.$ele = $(element);


        /**
         * what is the category the developer entered
         * <suggestions data-category="">
         */
        this.category = this.$ele.attr("data-category");


        /**
         * if - check if a category is defined if not then defaul it.
         *
         */
        if (!this.category) {
            this.category = categories.default;
        }


        /**
         * the max number of suggestions to show, will always try to show
         * this number.
         */
        this.limit = this.$ele.attr('data-limit');

        /**
         * cache the proxy functions for the ajax calls, this we we don't have
         * to keep recreating them for every check.
         */
        this.proxies = {};
        this.proxies.checkDone = $.proxy(this.handleCheckDone, this);
        this.proxies.checkError = $.proxy(this.handleCheckError, this);
        this.proxies.usernameSelected = $.proxy(this.handleUsernameSelected, this);

        /**
         * the template to use for each row of the suggestions
         * the tempalte needs to have an <li> element
         */
        this.template = _.template($("#user_suggestion_selection").html());


        /**
         * when a user clicks on a suggestion.
         */
        this.$ele.on("click", "li", this.proxies.usernameSelected);


        /**
         * an easy way to have events for this object
         * users of the component can now do component.events.on(event,callback);
         * right now used for when a user clicks on a suggestion
         */
        this.events = $("<div></div>");


        /**
         * this is how many users names to try to create and check at once.
         * to increas the chance that we will end up with the limit.
         */

        this.batch_size = 10;


        /**
         * what modifier to start with
         */
        this.modifier_count = 0;

        this.username_modifers = [
            this.removeTrailingNumbers
        ];
    }

    Component.prototype.removeTrailingNumbers = function(username) {

            return username.replace(trailing_numbers_regex, '');

        }
        /**
         * Component.prototype.handleUsernameSelected - called when a user clicks on a suggestion
         *
         * @param  {jquery event} event description
         * @return {type}       description
         */
    Component.prototype.handleUsernameSelected = function(event) {


        /**
         * get the username the user selected
         */
        var value = $(event.target).attr("data-username");


        /**
         * trigger an event so that other compoents can listen for it and handle it.
         */
        this.events.trigger("username_selected", {
            username: value
        });
    }


    /**
     * Component.prototype.getCategorySuggestions -
     * using the selected category create a number of suggestions and return the =m
     * @param  {string} username the username to use as the base for suggestions
     * @return {type}          description
     */
    Component.prototype.getCategorySuggestions = function(username) {

        var start = this.batch * this.batch_size;
        var end = start + this.batch_size;
        var postFixes = categories[this.category].postFixes.slice(start, end);
        var names = {};
        for (var x = 0, i = postFixes.length; x < i; x++) {
            names[username + postFixes[x]] = true;

        }
        return names;
    }


    /**
     * Component.prototype.handleCheckError -
     * TODO: add an error message to the suggestion ui
     * and trigger an error for other Components to lisen to
     * @return {type}  description
     */
    Component.prototype.handleCheckError = function() {}

    /**
     * Component.prototype.clear - reset the ui
     *
     * @return {type}  description
     */
    Component.prototype.clear = function() {

        this.$ele.html("");

    }

    /**
     * Component.prototype.handleCheckDone - handle the server return from the
     * checks we did.
     *
     * @param  {type} data data from the server in the format of
     *    [{"username":"Hillary2016","id":4791423}]
     * @return {type}      description
     */
    Component.prototype.handleCheckDone = function(data) {
        var component = this;
        var curr_sugg = this.current_suggestions;
        var limit = this.limit || data.length;


        /**
         * for - remove the suggesions that were already used
         *
         */
        for (var x = 0, i = data.length; x < i; x++) {
            delete curr_sugg[data[x].username];
        }
        var count = 0;


        /**
         * if we havent it the limit, lets try another batch.
         */
        if (_.keys(curr_sugg).length < limit) {
            this.getNextBatch();
            return;
            // need to get a new batch.
        } else {

            /**
             * if we did then show the suggestions.
             */
            this.showSuggestions(curr_sugg);
        }
    }


    /**
     * Component.prototype.showSuggestions - show the suggeestions to the user.
     *
     * @param  {type} suggestions description
     * @return {type}             description
     */
    Component.prototype.showSuggestions = function(suggestions) {
        var component = this;
        var html = "<ul>";
        var limit = this.limit || 9999999;
        var count = 0;


        /**
         * suggestions - run throught the suggestions
         * using the tempate for each username.when we hit the limit break the loop.
         */
        _.each(_.keys(suggestions), function(value, key) {
            html += component.template({
                username: value
            });
            count++;
            if (count >= limit) {
                return false;
            }
        });

        html += "</ul>"

        /**
         * update myself with the username suggestion list.
         */
        this.$ele.html(html);
    }

    /**
     * Component.prototype.getNextBatch -
     * using the current username checking and create a new_suggestions batch.
     * @return {type}  description
     */
    Component.prototype.getNextBatch = function() {
            var new_suggestions = this.getCategorySuggestions(this.current_username);


            /**
             * make sure we aren't out of suggestions
             * if there are no more suggestions, but we have current suggestions.
             * meaning we weren't at the limit, but we don't have anothe batch.
             * show what we can suggest.
             */
            if (_.isEmpty(new_suggestions)) {

                /**
                 * if - if we havent tried all the name mangling we can then lets do it.
                 *
                 * @param  {type} this.modifier_count < this.username_modifers.length description
                 * @return {type}                                                     description
                 */
                if (this.modifier_count < this.username_modifers.length) {

                    /**
                     * keep mangling until all the username is differnt from the original.
                     */
                    while (this.modifier_count < this.username_modifers.length && (this.current_username == this.original_username)) {

                        this.current_username = this.username_modifers[this.modifier_count](this.current_username);
                        this.modifier_count++;
                    }
                    this.batch = 0;
                    this.getNextBatch();

                } else if (_.keys(this.current_suggestions).length) {
                    this.showSuggestions();

                }
            } else {

                /**
                 * merge the new suggestions with the other suggestions.
                 * then check them all. Need to make sure that the other suggestions weren't
                 * taken while we built the list.
                 */
                _.merge(this.current_suggestions, new_suggestions);
                Chegg.services.usernames.checkUsernames(_.keys(this.current_suggestions)).done(this.proxies.checkDone).error(this.proxies.checkError);

            }
            this.batch++
        }
        /**
         * Component.prototype.updateSuggestion - this is to get suggestions for a new username.
         * this will reset the component and get a batch of suggestions.
         *
         * @param  {type} username description
         * @return {type}          description
         */

    Component.prototype.updateSuggestion = function(username) {
        this.current_username = username;
        this.original_username = username;
        this.batch = 0;
        this.current_suggestions = [];
        this.modifer_count = 0;
        this.getNextBatch();
    }
    return function(ele) {

        return new Component(ele);
    }

})(jQuery);

var Chegg = Chegg || {};
Chegg.services = Chegg.services || {};

/**
 * username service - just set up the url and call the service.
 * this is a singleton.
 *
 * @param  {type} function($ description
 * @return {type}            description
 */
Chegg.services.usernames = (function($) {

    /**
     * url to called
     *
     */
    var api_url = "http://chegg-tutors.appspot.com/coding-challenge/api/user/";


    /**
     * checkUsernames - build the url
     *
     * @param  {string|array} username string or array of usernames to check
     * @return {type}          description
     */
    function checkUsernames(username) {
        var check_names = '';


        /**
         * check_names will contain either a comma seperated list in
         * case of an array or a just the username.
         */
        if (_.isArray(username)) {
            check_names = username.join(',');

        } else if (_.isString(username)) {
            check_names = username;
        } else {
            console.error("service.username.checkUsernames requires a string or an array");
            return false;
        }


        /**
         * return the promise so the componet can listen to it. 
         */
        return $.get(api_url, {
            username: check_names
        });
    }

    return {

        checkUsernames: checkUsernames,

    }

})(jQuery);
