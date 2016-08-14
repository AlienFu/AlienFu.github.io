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
    var api_url = "//chegg-tutors.appspot.com/coding-challenge/api/user/";


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
