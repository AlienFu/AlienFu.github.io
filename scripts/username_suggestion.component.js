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
