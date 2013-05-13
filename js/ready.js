var docpatch = {};

ks.ready(function () {
    /**
     * Configures OnePageNav.
     */
    $('#topnav').onePageNav({
        currentClass: 'current',
        changeHash: false,
        scrollSpeed: 750,
        scrollOffset: 80
    });

    /**
     * Configures and initiates DocPatch.
     */
    docpatch = new DocPatch({
        prefix: "brd_grundgesetz_",
        repoDir: "grundgesetz-dev",
        dateFormat: "dd.mm.yy"
    });
});
