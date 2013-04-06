/**
 * DocPatch
 */

/*global $, Chart, createStoryJS, localStorage, diff_match_patch, d3, XRegExp */

var DocPatch = function (options) {

    "use strict";

    /**
     * Prefix used for created output files
     */
    this.prefix = options.prefix;

    /**
     * Base URI for the repository
     */
    this.repoDir = options.repoDir;

    /**
     * Standard date format
     */
    this.dateFormat = options.dateFormat;

    /**
     * Meta data
     */
    this.meta = {};

    /**
     * Supported formats
     */
    this.formats = [
        {
            "title": "DocBook",
            "ext": "db"
        },
        {
            "title": "eBook (EPUB)",
            "ext": "epub"
        },
        {
            "title": "HTML",
            "ext": "html"
        },
        {
            "title": "JSON",
            "ext": "json"
        },
        {
            "title": "Klartext (txt)",
            "ext": "txt"
        },
        {
            "title": "LaTeX",
            "ext": "tex"
        },
        {
            "title": "Man Page",
            "ext": "gz"
        },
        {
            "title": "Markdown",
            "ext": "md"
        },
        {
            "title": "Mediawiki",
            "ext": "wiki"
        },
        {
            "title": "Open Document",
            "ext": "xml"
        },
        {
            "title": "Open Document Format (ODT)",
            "ext": "odt"
        },
        {
            "title": "org mode (Emacs)",
            "ext": "org"
        },
        {
            "title": "PDF",
            "ext": "pdf"
        },
        {
            "title": "RST",
            "ext": "text"
        },
        {
            "title": "RTF",
            "ext": "rtf"
        },
        {
            "title": "Textile",
            "ext": "textile"
        }
    ];

    /**
     * Previous revision ID used at runtime
     */
    this.previousRevisionID = 0;

    var that = this;

    /**
     * Calculates age.
     *
     * @param string dateString Date of "birth"
     *
     * @return int
     */
    this.calculateAge = function (dateString) {
        var today = new Date(),
            birthDate = new Date(dateString),
            age = today.getFullYear() - birthDate.getFullYear(),
            m = today.getMonth() - birthDate.getMonth();

        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age -= 1;
        }

        return age;
    };

    /**
     * Draws changes per year as bar chart.
     */
    this.drawChangesPerYear = function () {
        var range,
            changes = {},
            ctx = $('#changesPerYear').get(0).getContext('2d'),
            chart;

        range = _.range(
            Number($.datepicker.formatDate('yy', new Date(_.first(that.meta.revisions).announced))),
            Number($.datepicker.formatDate('yy', new Date(_.last(that.meta.revisions).announced))) + 1
        );

        $.each(range, function () {
            changes[this.valueOf()] = 0;
        });

        $.each(that.meta.revisions, function () {
            var year = Number($.datepicker.formatDate('yy', new Date(this.announced)));
            changes[year] += 1;
        });

        chart = new Chart(ctx).Bar({
            labels : range,
            datasets : [
                {
                    data : $.map(changes, function (key, value) { return key; })
                }
            ]
        });
    };

    /**
     * Draws changes per legislative period as bar chart.
     */
    this.drawChangesPerPeriod = function () {
        var range,
            changes = {},
            ctx = $('#changesPerPeriod').get(0).getContext('2d'),
            chart;

        range = _.range(
            // Skip the first revision:
            Number(that.meta.revisions[1].legislativeSession.id),
            Number(_.last(that.meta.revisions).legislativeSession.id) + 1
        );

        $.each(range, function () {
            changes[this.valueOf()] = 0;
        });

        $.each(that.meta.revisions, function () {
            if (this.legislativeSession) {
                var year = Number(this.legislativeSession.id);
                changes[year] += 1;
            }
        });

        chart = new Chart(ctx).Bar({
            labels : range,
            datasets : [
                {
                    data : $.map(changes, function (key, value) { return key; })
                }
            ]
        });
    };

    /**
     * Draws pie chart for result of the vote.
     */
    this.drawResultOfTheVote = function () {
        var revision = that.meta.revisions[Number($('#revisionStats').val())],
            yes = (revision.votes && revision.votes.yes) || 0,
            no = (revision.votes && revision.votes.no) || 0,
            abstentions = (revision.votes && revision.votes.abstentions) || 0,
            notVoted = (revision.votes && revision.votes.notVoted) || 0,
            invalid = (revision.votes && revision.votes.invalid) || 0,
            sum = yes + no + abstentions + notVoted + invalid,
            ctx,
            chart;

        // Reset:
        $('#resultOfTheVoteAlert').removeClass('in');
        $('#resultOfTheVote').hide();
        $('#resultOfTheVoteList').hide();

        if (!revision.votes) {
            $('#resultOfTheVoteAlert').addClass('in');
            return;
        }

        ctx = $('#resultOfTheVote').fadeIn().get(0).getContext('2d');

        chart = new Chart(ctx).Pie([
            {
                value: yes,
                color: "#468847"
            },
            {
                value: no,
                color: "#B94A48"
            },
            {
                value: abstentions,
                color: "#F89406"
            },
            {
                value: notVoted,
                color: "#3A87AD"
            },
            {
                value: invalid,
                color: "#999999"
            }
        ]);

        $('#resultOfTheVoteList').html(
            '<li><span class="badge badge-success">' + yes + '</span> ja</li>' +
            '<li><span class="badge badge-important">' + no + '</span> nein</li>' +
            '<li><span class="badge badge-warning">' + abstentions + '</span> enthalten</li>' +
            '<li><span class="badge badge-info">' + notVoted + '</span> nicht abgestimmt</li>' +
            '<li><span class="badge">' + invalid + '</span> ungültig</li>' +
            '<li><strong>' + sum + '</strong> insgesamt</li>'
        ).fadeIn();
    };

    /**
     * Compares two revisions in a modal.
     *
     * @param object firstRevision First revision, e. g. the older one
     * @param object secondRevision Second revision, e. g. the newer one
     */
    this.compareRevisions = function (firstRevision, secondRevision) {
        var dmp = new diff_match_patch(),
            firstText = '',
            secondText = '',
            firstRevisionTitle = 'ohne Titel',
            secondRevisionTitle = 'ohne Titel',
            firstRevisionAnnounced = 'ohne Datum',
            secondRevisionAnnounced = 'ohne Datum',
            firstRevisionID,
            secondRevisionID,
            d,
            comparisionOutput;

        if (firstRevision !== -1) {
            firstRevisionID = that.createRevisionID(that.meta.revisions[firstRevision]);

            firstText = that.fetchOrCache(
                firstRevisionID,
                that.repoDir + '/out/' + that.prefix + firstRevisionID + '.txt',
                'text',
                false
            );

            firstRevisionTitle = that.meta.revisions[firstRevision].title;
            firstRevisionAnnounced = $.datepicker.formatDate(that.dateFormat, new Date(that.meta.revisions[firstRevision].announced));
        }

        if (secondRevision !== -1) {
            secondRevisionID = that.createRevisionID(that.meta.revisions[secondRevision]);

            secondText = that.fetchOrCache(
                secondRevisionID,
                that.repoDir + '/out/' + that.prefix + secondRevisionID + '.txt',
                'text',
                false
            );

            secondRevisionTitle = that.meta.revisions[secondRevision].title;
            secondRevisionAnnounced = $.datepicker.formatDate(that.dateFormat, new Date(that.meta.revisions[secondRevision].announced));
        }

        dmp.Diff_Timeout = 1.0;
        dmp.Diff_EditCost = 4.0;

        d = dmp.diff_main(firstText, secondText);
        //dmp.diff_cleanupSemantic(d);
        //dmp.diff_cleanupEfficiency(d);
        comparisionOutput = dmp.diff_prettyHtml(d);

        $('#compareModalLabel').html('Fassung &bdquo;<span class="highlightfirstrevision">' + firstRevisionTitle + '</span>&rdquo; (' + firstRevisionAnnounced + ') verglichen mit Fassung &bdquo;<span class="highlightsecondrevision">' + secondRevisionTitle + '</span>&rdquo; (' + secondRevisionAnnounced + ')');

        $('#compareModal .modal-body').html(comparisionOutput);

        $('#compareModal').modal();
    };

    /**
     * Creates unique revision identifier.
     *
     * @param object revision Revision
     *
     * @return string
     */
    this.createRevisionID = function (revision) {
        return revision.id + '_' + revision.announced;
    };

    /**
     * Fetches data via AJAX and stores it in local storage if possbile. If data is already stored in local storage it will be re-used.
     *
     * @param string key Unique data identifier
     * @param string uri Unique resource identifier
     * @param string type MIME type
     * @param bool async Make a asynchronous AJAX call or not.
     *
     * @return mixed Data
     */
    this.fetchOrCache = function (key, uri, type, async) {
        var value;

        if (localStorage) {
            value = localStorage.getItem(key);

            if (!value) {
                $.ajax({
                    url: uri,
                    dataType: type,
                    async: async
                }).done(function (response) {
                    value = response;

                    if (type === 'json') {
                        response = JSON.stringify(response);
                    }

                    localStorage.setItem(key, response);
                });
            } else if (type === 'json') {
                value = JSON.parse(value);
            }
        } else {
            $.ajax({
                url: uri,
                dataType: type,
                async: async
            }).done(function (response) {
                return response;
            });
        }

        return value;
    };

    /**
     * Collects meta data for a revision. Output is formatted for being processed by that.formatMeta().
     *
     * @param object revision Revision
     *
     * @return string
     */
    this.collectMetaData = function (revision) {
        var collectedMetaData = [],
            year,
            passed,
            date,
            announced,
            effectiveSince,
            articles,
            signedOffBy,
            sources,
            votes;

        if (revision.passed) {
            passed = new Date(revision.passed);
            year = $.datepicker.formatDate('yy', passed);

            collectedMetaData.push({
                key: 'Verabschiedet',
                value: '<a href="http://de.wikipedia.org/wiki/' + year + '" title="' + year + ' (Wikipedia)">' + $.datepicker.formatDate(that.dateFormat, passed) + '</a>'
            });
        }

        if (revision.date) {
            date = new Date(revision.date);
            year = $.datepicker.formatDate('yy', date);

            collectedMetaData.push({
                key: 'Gesetz vom',
                value: '<a href="http://de.wikipedia.org/wiki/' + year + '" title="' + year + ' (Wikipedia)">' + $.datepicker.formatDate(that.dateFormat, date) + '</a>'
            });
        }

        if (revision.announced) {
            announced = new Date(revision.announced);
            year = $.datepicker.formatDate('yy', announced);

            collectedMetaData.push({
                key: 'Angekündigt',
                value: '<a href="http://de.wikipedia.org/wiki/' + year + '" title="' + year + ' (Wikipedia)">' + $.datepicker.formatDate(that.dateFormat, announced) + '</a>'
            });
        }

        if (revision.effectiveSince) {
            effectiveSince = new Date(revision.effectiveSince);
            year = $.datepicker.formatDate('yy', effectiveSince);

            collectedMetaData.push({
                key: 'Inkraftgetreten am',
                value: '<a href="http://de.wikipedia.org/wiki/' + year + '" title="' + year + ' (Wikipedia)">' + $.datepicker.formatDate(that.dateFormat, effectiveSince) + '</a>'
            });
        }

        if (revision.articles) {
            articles = [];

            if (revision.articles.created) {
                articles.push(
                    'Artikel ' + revision.articles.created.join(', ') + ' hinzugefügt'
                );
            }

            if (revision.articles.updated) {
                articles.push(
                    'Artikel ' + revision.articles.updated.join(', ') + ' verändert'
                );
            }

            if (revision.articles.deleted) {
                articles.push(
                    'Artikel ' + revision.articles.deleted.join(', ') + ' entfernt'
                );
            }

            collectedMetaData.push({
                key: 'Änderungen',
                value: '<a href="javascript:docpatch.compareRevisions(' + that.previousRevisionID + ', ' + revision.id + ')" title="">' + articles.join('; ') + '</a>'
            });
        }

        if (revision.signedOffBy) {
            signedOffBy = [];

            $.each(revision.signedOffBy, function () {
                signedOffBy.push(
                    ((this.uri) ? '<a href="' + this.uri + '" title="' + this.uri + '">' + this.name + '</a>' : this.name) + ' (' + this.role + ')'
                );
            });

            collectedMetaData.push({
                key: 'Unterschreiber',
                value: signedOffBy.join(', ')
            });
        }

        if (revision.sources) {
            sources = [];

            $.each(revision.sources, function () {
                sources.push(
                    this.title + ', Seite ' + this.pages
                );
            });

            collectedMetaData.push({
                key: 'Quellen',
                value: sources.join(', ')
            });
        }

        if (revision.legislativeSession) {
            collectedMetaData.push({
                key: '<a href="http://de.wikipedia.org/wiki/Deutscher_Bundestag" title="Deutscher Bundestag (Wikipedia)">Legislaturperiode</a>',
                value: '<a href="' + revision.legislativeSession.uri + '" title="' + revision.legislativeSession.id + '. Bundestag (Wikipedia)">' + revision.legislativeSession.id + '. Bundestag</a>'
            });
        }

        if (revision.votes) {
            votes = [];

            if (revision.votes.yes !== undefined) {
                votes.push(
                    revision.votes.yes + ' Ja-Stimme' + (revision.votes.yes !== 1 ? 'n' : '')
                );
            }

            if (revision.votes.no !== undefined) {
                votes.push(
                    revision.votes.no + ' Nein-Stimme' + (revision.votes.no !== 1 ? 'n' : '')
                );
            }

            if (revision.votes.abstentions !== undefined) {
                votes.push(
                    revision.votes.abstentions + ' Enthaltung' + (revision.votes.abstentions !== 1 ? 'en' : '')
                );
            }

            if (revision.votes.notVoted !== undefined) {
                votes.push(
                    revision.votes.notVoted + ' nicht abgestimmt'
                );
            }

            if (revision.votes.invalid !== undefined) {
                votes.push(
                    revision.votes.invalid + ' ungültig'
                );
            }

            collectedMetaData.push({
                key: 'Abstimmung',
                value: votes.join(', ')
            });
        }

        if (revision.initiativeOf) {
            collectedMetaData.push({
                key: 'Initiative von',
                value: revision.initiativeOf
            });
        }

        that.previousRevisionID = revision.id;

        return collectedMetaData;
    };

    /**
     * Formats meta data for a revision. Used for the timeline.
     *
     * @param object revision Revision
     *
     * @return string HTML formatted output
     */
    this.formatMeta = function (revision) {
        var formatted = '<table>',
            collectedMetaData = that.collectMetaData(revision);

        $.each(collectedMetaData, function () {
            formatted += '<tr><th>' + this.key + ':</th><td>' + this.value + '</td></tr>';
        });

        formatted += '</table>';

        return formatted;
    };

    /**
     * Draws table for statistics about actors.
     */
    this.drawActorsTable = function () {
        var actors = {},
            entities = [],
            i;

        if (!that.actorsTableDrawn) {
            that.actorsTableDrawn = 0;
        }

        if (that.actorsTableDrawn === 1) {
            return;
        }

        $.each(that.meta.revisions, function () {
            if (this.signedOffBy) {
                $.each(this.signedOffBy, function () {
                    if (actors[this.uri]) {
                        actors[this.uri].number += 1;
                        actors[this.uri].roles.push(this.role);
                    } else {
                        actors[this.uri] = {};
                        actors[this.uri].name = this.name;
                        actors[this.uri].roles = [this.role];
                        actors[this.uri].number = 1;
                        actors[this.uri].uri = this.uri;
                    }
                });
            }
        });

        for (i in actors) {
            var roles = _.uniq(actors[i].roles);

            entities.push([
                '<a href="' + actors[i].uri + '" title="' + actors[i].uri + '">' + actors[i].name + '</a>',
                roles.join(', '),
                actors[i].number
            ]);
        }

        // TODO There is an empty element at the end:
        entities.slice(-1);

        $('#actorsTable').dataTable({
            /*"sDom": "<'row'<'span6'l><'span6'f>r>t<'row'<'span6'i><'span6'p>>",
            "sPaginationType": "bootstrap",
            "oLanguage": {
                "sLengthMenu": "_MENU_ records per page"
            },*/
            "aaData": entities,
            "aoColumns": [
                { "sTitle": "Name" },
                { "sTitle": "Rollen" },
                { "sTitle": "Unterschriften", "sClass": "right" }
            ]
        });

        that.actorsTableDrawn = 1;
    };

    /**
     * Draws table for statistics about articles.
     */
    this.drawArticlesTable = function () {
        var articles = {},
            entities = [];

        if (!that.articlesTableDrawn) {
            that.articlesTableDrawn = 0;
        }

        if (that.articlesTableDrawn === 1) {
            return;
        }

        $.each(that.meta.revisions, function () {
            var version = this.id + 1;

            if (this.articles) {
                $.each(this.articles, function (key, value) {
                    $.each(value, function () {
                        if (!articles[this]) {
                            articles[this] = {};
                            articles[this].numberOfChanges = 0;
                            articles[this].history = {};
                        }

                        articles[this].numberOfChanges += 1;

                        switch (key) {
                        case 'created':
                            articles[this].history.created = version;
                            break;
                        case 'updated':
                            if (!articles[this].history.updated) {
                                articles[this].history.updated = [];
                            }
                            articles[this].history.updated.push(version);
                            break;
                        case 'deleted':
                            articles[this].history.deleted = version;
                            break;
                        } //switch
                    }); //each value
                });
            }
        });

        $.each(articles, function (key, value) {
            var history = [];

            if (value.history.created) {
                history.push('hinzugefügt in Fassung ' + value.history.created);
            }

            if (value.history.updated) {
                if (value.history.updated.length === 1) {
                    history.push('geändert in Fassung ' + value.history.updated.join(', '));
                } else {
                    history.push('geändert in Fassungen ' + value.history.updated.join(', '));
                }
            }

            if (value.history.deleted) {
                history.push('aufgehoben in Fassung ' + value.history.deleted);
            }

            entities.push([
                key,
                value.numberOfChanges,
                history.join(', ')
            ]);
        });

        $('#articlesTable').dataTable({
            /*"sDom": "<'row'<'span6'l><'span6'f>r>t<'row'<'span6'i><'span6'p>>",
            "sPaginationType": "bootstrap",
            "oLanguage": {
                "sLengthMenu": "_MENU_ records per page"
            },*/
            "aaData": entities,
            "aoColumns": [
                { "sTitle": "Artikelnummer" },
                { "sTitle": "Anzahl Änderungen", "sClass": "right" },
                { "sTitle": "Historie" }
            ]
        });

        that.articlesTableDrawn = 1;
    };
    
    /**
     * Draws word cloud.
     */
    this.drawWordCloud = function () {
        var fill = d3.scale.category20(),
            words = [],
            lastRevisionID = that.createRevisionID(latest),
            blackList,
            progress = 0,
            // Number of words to draw:
            max = 100,
            // Associative array (word type => frequency):
            wordList = {},
            // Number of word tokens:
            wordCount = 0,
            isBlack = {},
            match,
            word,
            regExp = XRegExp('[\\p{L}\\d\\-]*\\p{L}{2,}[\\p{L}\\d\\-]+', 'igm');

        if (!that.wordCloudDrawn) {
            that.wordCloudDrawn = 0;
        }

        if (that.wordCloudDrawn === 1) {
            return;
        }
        
        var text = that.fetchOrCache(
            lastRevisionID,
            that.repoDir + '/out/' + that.prefix + lastRevisionID + '.txt',
            'text',
            false
        );

        // TODO This is German only.
        blackList = that.fetchOrCache(
            'germanST',
            'Kickstrap/extras/blacklist/germanST.txt',
            'text',
            false
        ).split("\r\n");
        
        _.each(blackList, function(w){
            isBlack[w] = true;
        });
        
        while (match = regExp.exec(text)) {
            word = match[0];
            // Omit words in stopword list:
            if (!(word in isBlack)) {
                wordCount += 1;
                if (word in wordList) {
                    wordList[word]++;
                } else {
                    wordList[word] = 1;
                }
            }
        }
        // Normalize:
        $.each(_.keys(wordList), function (k) {
            wordList[k] = wordList[k] / wordCount;
        });

        // Finish:
        words = _.keys(wordList).slice(0, max);
        
        $('#wordCloudLoading progress').attr('value', 0).attr('max', max);
        $('#wordCloudLoading span').html(progress + '/' + max);

        d3.layout.cloud()
            .size([2342, 1200])
            .timeInterval(10)
            .words(words.map(function (d) {
                return {
                    text: d, size: 10 + Math.random() * 50
                };
            }))
            .rotate(function () { return ~~(Math.random() * 2) * 90; })
            .font('Impact')
            .fontSize(function (d) { return d.size; })
            .on('word', function () {
                progress += 1;
                $('#wordCloudLoading progress').attr('value', progress);
                $('#wordCloudLoading span').html(progress + '/' + max);
            })
            .on('end', draw)
            .start();

        that.wordCloudDrawn = 1;

        function draw (words) {
            d3.select("#wordCloudImage").insert("svg")
                .attr("width", 979)
                .attr("height", 600)
            .append("g")
                .attr("transform", "translate(150,150)")
            .selectAll("text")
                .data(words)
            .enter().append("text")
                .style("font-size", function (d) { return d.size + "px"; })
                .style("font-family", "Impact")
                .style("fill", function (d, i) { return fill(i); })
                .attr("text-anchor", "middle")
                .attr("transform", function (d) {
                return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
                })
                .text(function (d) { return d.text; });

            $('#wordCloudLoading').fadeOut();
        }
    };

    /**
     * Makes *the* meta data available.
     */
    this.meta = this.fetchOrCache(
        'meta',
        this.repoDir + '/etc/meta.json',
        'json',
        false
    );

    /**
     * Fills up some fields with revision data.
     */
    $.each(this.meta.revisions.reverse(), function () {
        $('#revision, #firstrevision, #secondrevision, #revisionStats')
            .append('<option value="' + this.id + '">' + (this.id + 1) + '. vom ' + $.datepicker.formatDate(that.dateFormat, new Date(this.announced)) + ': ' + this.title + '</option>');
    });

    /**
     * @todo Dirty hack...
     */
    this.meta.revisions.reverse();

    /**
     * Fills up field for created output formats
     */
    $.each(this.formats, function () {
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
        this.repoDir + '/out/' + this.prefix + this.createRevisionID(this.meta.revisions[Number($('#revision').val())]) + '.' + $('#format').val()
    );

    /**
     * Updates download button whenever revision or format is changed.
     */
    $('#revision, #format').change(function () {
        var revisionID = that.createRevisionID(that.meta.revisions[Number($('#revision').val())]);

        $('#download').attr(
            'href',
            that.repoDir + '/out/' + that.prefix + revisionID + '.' + $('#format').val()
        );
    });

    /**
     * Initiates button on top of page for downloading last revision in default format.
     */

    var latest = this.meta.revisions.slice(-1)[0];

    $('#latest').attr(
        'href',
        this.repoDir + '/out/' + this.prefix + this.createRevisionID(latest) + '.pdf'
    );

    $('#latest').attr(
        'title',
        (latest.id + 1) + '. Fassung "' + latest.title + '" vom ' + $.datepicker.formatDate(this.dateFormat, new Date(latest.announced)) + ' im PDF-Format herunterladen'
    );

    /**
     * Initiates timeline data.
     */
    var timelineData = {
        "timeline": {
            "headline": this.meta.title,
            "type": "default",
            "text": this.meta.subject,
            "startDate": "1949,5,23",
            "date": []
        }
    };

    /**
     * Fills up timeline with revision data.
     */
    $.each(this.meta.revisions, function () {
        var announced = new Date(this.announced);

        timelineData.timeline.date.push({
            "startDate": $.datepicker.formatDate('yy,m,d', announced),
            "endDate": $.datepicker.formatDate('yy,m,d', announced),
            "headline": this.title,
            "text": that.formatMeta(this),
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
    $('#comparerevisions').click(function () {
        var firstRevision = Number($('#firstrevision').val()),
            secondRevision = Number($('#secondrevision').val());

        that.compareRevisions(firstRevision, secondRevision);
    });

    /**
     * Fires events whenever tabs are clicked.
     */
    $('a[data-toggle="tab"]').on('shown', function (e) {
        switch (e.target.href.split('#')[1]) {
        case 'legislativeSessions':
            that.drawChangesPerPeriod();
            break;
        case 'years':
            that.drawChangesPerYear();
            break;
        case 'actors':
            that.drawActorsTable();
            break;
        case 'revisions':
            that.drawResultOfTheVote();
            break;
        case 'articles':
            that.drawArticlesTable();
            break;
        case 'wordcloud':
            that.drawWordCloud();
            break;
        }
    });

    /**
     * Updates chart for result of the vote whenever revision is changed.
     */
    $('#revisionStats').change(function () {
        that.drawResultOfTheVote();
    });

    /**
     * Counts revisions for statistics.
     */
    this.numberOfChanges = this.meta.revisions.length - 1;
    $('#numberOfChanges').html(this.numberOfChanges);

    /**
     * Calculates age of document for statistics.
     */
    this.age = this.calculateAge(
        this.meta.revisions[0].announced
    );
    $('#age').html(this.age);

    /**
     * Counts legislative sessions for statistics.
     */
    this.numberOfLegislativeSessions = latest.legislativeSession.id;
    $('#numberOfLegislativeSessions').html(this.numberOfLegislativeSessions);

    /**
     * Calculates changes per legislative session for statistics.
     */
    this.changesPerLegislativeSessions = this.numberOfChanges / this.numberOfLegislativeSessions;
    $('#numberOfChangesPerLegislativeSessions').html(
        Number(this.changesPerLegislativeSessions.toFixed(2))
    ).attr(
        'title',
        this.changesPerLegislativeSessions
    );

    /**
     * Calculates changes per year for statistics.
     */
    this.changesPerYear = this.numberOfChanges / this.age;
    $('#numberOfChangesPerYear').html(
        Number(this.changesPerYear.toFixed(2))
    ).attr(
        'title',
        this.changesPerYear
    );

};
