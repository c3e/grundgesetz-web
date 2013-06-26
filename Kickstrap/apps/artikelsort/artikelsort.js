/* Artikelsort (plugin for DataTables, defines sort type "artikel")
 *
 *
 * Sort strings such as article numbers in laws:
 *   "12" < "12a" < "123" < "123a" < "124"
 */

(function () {
    var article_re = /(\d+)([a-z]*)/;
    function get_components(s) {
        /* only take the two submatches */
        var match = s.match(article_re).slice(1, 3);

        /* first component must be number: */
        match[0] = parseInt(match[0], 10);
        return match;
    }
    function artikelSort(m_a, m_b) {
        /*
         * An article number consists of digits and potentially letters;
         * comparison is first by the number expressed in digits, then by the
         * additional qualifier letters. No qualifier (empty second part)
         * ranks "lowest", other qualifiers are ranked alphabetically.
         *
         */
        var ret;
        if (m_a[0] === m_b[0]) {
            if (m_a[1] === m_b[1]) {
                ret = 0;
            } else if (m_a[1] < m_b[1]) {
                ret = -1;
            } else if (m_a[1] > m_b[1]) {
                ret = 1;
            }
        } else if (m_a[0] < m_b[0]) {
            ret = -1;
        } else if (m_a[0] > m_b[0]) {
            ret = 1;
        }
        return ret;
    }

    jQuery.extend(jQuery.fn.dataTableExt.oSort, {
        "artikel-pre": get_components,

        "artikel-asc": artikelSort,

        "artikel-desc": function (a, b) {
            return artikelSort(a, b) * -1;
        }
    });
}());
