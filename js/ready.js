/**
 * Will be called if Kickstrap is ready.
 */
ks.ready(function() {

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
     * Makes *the* meta data available.
     */
    DocPatch.meta = DocPatch.fetchOrCache(
        'meta',
        DocPatch.repoDir + '/etc/meta.json',
        'json',
        false
    );

    /**
     * Fills up some fields with revision data.
     */
    $.each(DocPatch.meta.revisions.reverse(), function() {
        $('#revision, #firstrevision, #secondrevision, #revisionStats')
            .append('<option value="' + this.id + '">' + (this.id + 1) + '. vom ' + $.datepicker.formatDate(DocPatch.dateFormat, new Date(this.announced)) + ': ' + this.title + '</option>');
    });

    /**
     * @todo Dirty hack...
     */
    DocPatch.meta.revisions.reverse();

    /**
     * Fills up field for created output formats
     */
    $.each(DocPatch.formats, function() {
        $('#format').append('<option value="' + this.ext + '" title="' + this.ext + '">' + this.title + '</option>');
    });

    /**
     * Defines PDF as default format.
     */
    $('#format option[value="pdf"]').attr('selected', 'selected');

    /**
     * Initiates button for downloading last revision in default format.
     */
    $('#download').attr(
        'href',
        DocPatch.repoDir + '/out/' + DocPatch.prefix + DocPatch.createRevisionID(DocPatch.meta.revisions[Number($('#revision').val())]) + '.' + $('#format').val()
    );

    /**
     * Updates download button whenever revision or format is changed.
     */
    $('#revision, #format').change(function() {
        var revisionID = DocPatch.createRevisionID(DocPatch.meta.revisions[Number($('#revision').val())]);

        $('#download').attr(
            'href',
            DocPatch.repoDir + '/out/' + DocPatch.prefix + revisionID + '.' + $('#format').val()
        );
    });

    /**
     * Initiates button on top of page for downloading last revision in default format.
     */

    var latest = DocPatch.meta.revisions.slice(-1)[0];

    $('#latest').attr(
        'href',
        DocPatch.repoDir + '/out/' + DocPatch.prefix + DocPatch.createRevisionID(latest) + '.pdf'
    );

    $('#latest').attr(
        'title',
        (latest.id + 1) + '. Fassung "' + latest.title + '" vom ' + $.datepicker.formatDate(DocPatch.dateFormat, new Date(latest.announced)) + ' im PDF-Format herunterladen'
    );

    /**
     * Initiates timeline data.
     */
    var timelineData = {
        "timeline": {
            "headline": DocPatch.meta.title,
            "type": "default",
            "text": DocPatch.meta.subject,
            "startDate": "1949,5,23",
            "date": []
        }
    };

    /**
     * Fills up timeline with revision data.
     */
    $.each(DocPatch.meta.revisions, function() {
        var announced = new Date(this.announced);

        timelineData.timeline.date.push({
            "startDate": $.datepicker.formatDate('yy,m,d', announced),
            "endDate": $.datepicker.formatDate('yy,m,d', announced),
            "headline": this.title,
            "text": DocPatch.formatMeta(this),
            "asset": {
                "media": "",
                "credit": "",
                "caption": ""
            }
        });
    });

    /**
     * Configures and builds timeline.
     */
    createStoryJS({
        type: "timeline",
        width: "100%",
        height: "600",
        source: timelineData,
        lang: "de",
        css: "Kickstrap/apps/timelinejs/css/timeline.css",
        js: "Kickstrap/apps/timelinejs/js/timeline-min.js",
        //font: "DroidSerif-DroidSans"
    });

    /**
     * Compares two revisions.
     */
    $('#comparerevisions').click(function() {
        var firstRevision = Number($('#firstrevision').val());
        var secondRevision = Number($('#secondrevision').val());

        DocPatch.compareRevisions(firstRevision, secondRevision);
    });

    /**
     * Fires events whenever tabs are clicked.
     */
    $('a[data-toggle="tab"]').on('shown', function (e) {
        switch(e.target.href.split('#')[1]) {
            case 'legislativeSessions':
                DocPatch.drawChangesPerPeriod();
                break;
            case 'years':
                DocPatch.drawChangesPerYear();
                break;
            case 'actors':
                DocPatch.drawActorsTable();
                break;
            case 'revisions':
                DocPatch.drawResultOfTheVote();
                break;
            case 'articles':
                DocPatch.drawArticlesTable();
                break;
        }
    });
    
    /**
     * Updates chart for result of the vote whenever revision is changed.
     */
    $('#revisionStats').change(function() {
        DocPatch.drawResultOfTheVote();
    });

    /**
     * Counts revisions for statistics.
     */
    DocPatch.numberOfChanges = DocPatch.meta.revisions.length - 1;
    $('#numberOfChanges').html(DocPatch.numberOfChanges);

    /**
     * Calculates age of document for statistics.
     */
    DocPatch.age = DocPatch.calculateAge(
        DocPatch.meta.revisions[0].announced
    );
    $('#age').html(DocPatch.age);

    /**
     * Counts legislative sessions for statistics.
     */
    DocPatch.numberOfLegislativeSessions = latest.legislativeSession.id;
    $('#numberOfLegislativeSessions').html(DocPatch.numberOfLegislativeSessions);

    /**
     * Calculates changes per legislative session for statistics.
     */
    DocPatch.changesPerLegislativeSessions = DocPatch.numberOfChanges / DocPatch.numberOfLegislativeSessions;
    $('#numberOfChangesPerLegislativeSessions').html(
        Number(DocPatch.changesPerLegislativeSessions.toFixed(2))
    ).attr(
        'title',
        DocPatch.changesPerLegislativeSessions
    );

    /**
     * Calculates changes per year for statistics.
     */
    DocPatch.changesPerYear = DocPatch.numberOfChanges / DocPatch.age;
    $('#numberOfChangesPerYear').html(
        Number(DocPatch.changesPerYear.toFixed(2))
    ).attr(
        'title',
        DocPatch.changesPerYear
    );
});
