/**
 * DocPatch
 */

var DocPatch = {};

/**
 * Prefix used for created output files
 */
DocPatch.prefix = "brd_grundgesetz_";

/**
 * Base URI for the repository
 */
DocPatch.repoDir = "grundgesetz-dev";

/**
 * Standard date format
 */
DocPatch.dateFormat = "dd.mm.yy";

/**
 * Meta data
 */
DocPatch.meta = {};

/**
 * Supported formats
 */
DocPatch.formats = [
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
DocPatch.previousRevisionID = 0;

/**
 * Calculates age.
 *
 * @param string dateString Date of "birth"
 *
 * @return int
 */
DocPatch.calculateAge = function(dateString) {
    var today = new Date(),
        birthDate = new Date(dateString),
        age = today.getFullYear() - birthDate.getFullYear(),
        m = today.getMonth() - birthDate.getMonth();

    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    return age;
}

/**
 * Draws changes per year as bar chart.
 */
DocPatch.drawChangesPerYear = function() {
    var range = _.range(
        Number($.datepicker.formatDate('yy', new Date(_.first(DocPatch.meta.revisions).announced))),
        Number($.datepicker.formatDate('yy', new Date(_.last(DocPatch.meta.revisions).announced))) + 1
    );
    
    var changesPerYear = {};
    
    $.each(range, function() {
        changesPerYear[this.valueOf()] = 0;
    });

    $.each(DocPatch.meta.revisions, function() {
        var year = Number($.datepicker.formatDate('yy', new Date(this.announced)));
        changesPerYear[year]++;
    });

    var data = {
        labels : range,
        datasets : [
            {
                data : $.map(changesPerYear, function(value, key) { return value; })
            }
        ]
    };

    var options = {};
    
    var ctx = $('#changesPerYear').get(0).getContext('2d');
    var chart = new Chart(ctx).Bar(data, options);
}

/**
 * Draws changes per legislative period as bar chart.
 */
DocPatch.drawChangesPerPeriod = function() {
    var range = _.range(
        // Skip the first revision:
        Number(DocPatch.meta.revisions[1].legislativeSession.id),
        Number(_.last(DocPatch.meta.revisions).legislativeSession.id) + 1
    );

    var changesPerPeriod = {};
    
    $.each(range, function() {
        changesPerPeriod[this.valueOf()] = 0;
    });

    $.each(DocPatch.meta.revisions, function() {
        if (this.legislativeSession) {
            var year = Number(this.legislativeSession.id);
            changesPerPeriod[year]++;
        }
    });

    var data = {
        labels : range,
        datasets : [
            {
                data : $.map(changesPerPeriod, function(value, key) { return value; })
            }
        ]
    };

    var options = {};
    
    var ctx = $('#changesPerPeriod').get(0).getContext('2d');
    var chart = new Chart(ctx).Bar(data, options);
}

DocPatch.drawResultOfTheVote = function() {
    var revision = DocPatch.meta.revisions[Number($('#revisionStats').val())];
    
    // Reset:
    $('#resultOfTheVoteAlert').removeClass('in');
    $('#resultOfTheVote').hide();
    $('#resultOfTheVoteList').hide();
    
    if (!revision.votes) {
        $('#resultOfTheVoteAlert').addClass('in');
        return;
    }
    
    var yes = revision.votes.yes || 0,
        no = revision.votes.no || 0,
        abstentions = revision.votes.abstentions || 0,
        notVoted = revision.votes.notVoted || 0,
        invalid = revision.votes.invalid || 0,
        sum = yes + no + abstentions + notVoted + invalid;
    
    var data = [
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
    ];
    
    var options = {};
    
    var ctx = $('#resultOfTheVote').fadeIn().get(0).getContext('2d');
    var chart = new Chart(ctx).Pie(data, options);
    
    $('#resultOfTheVoteList').html(
        '<li><span class="badge badge-success">' + yes + '</span> ja</li>' +
        '<li><span class="badge badge-important">' + no + '</span> nein</li>' +
        '<li><span class="badge badge-warning">' + abstentions + '</span> enthalten</li>' +
        '<li><span class="badge badge-info">' + notVoted + '</span> nicht abgestimmt</li>' +
        '<li><span class="badge">' + invalid + '</span> ungültig</li>' +
        '<li><strong>' + sum + '</strong> insgesamt</li>'
    ).fadeIn();;
}

/**
 * Compares two revisions in a modal.
 *
 * @param object firstRevision First revision, e. g. the older one
 * @param object secondRevision Second revision, e. g. the newer one
 */
DocPatch.compareRevisions = function(firstRevision, secondRevision) {
    var dmp = new diff_match_patch();
    var firstText = '';
    var secondText = '';
    var firstRevisionTitle = 'ohne Titel';
    var secondRevisionTitle = 'ohne Titel';
    var firstRevisionAnnounced = 'ohne Datum';
    var secondRevisionAnnounced = 'ohne Datum';

    if (firstRevision != '-1') {
        var firstRevisionID = DocPatch.createRevisionID(DocPatch.meta.revisions[firstRevision]);
        
        firstText = DocPatch.fetchOrCache(
            firstRevisionID,
            DocPatch.repoDir + '/out/' + DocPatch.prefix + firstRevisionID + '.txt',
            'text',
            false
        );

        firstRevisionTitle = DocPatch.meta.revisions[firstRevision].title;
        firstRevisionAnnounced = $.datepicker.formatDate(DocPatch.dateFormat, new Date(DocPatch.meta.revisions[firstRevision].announced));
    }
    
    if (secondRevision != '-1') {
        var secondRevisionID = DocPatch.createRevisionID(DocPatch.meta.revisions[secondRevision]);
        
        secondText = DocPatch.fetchOrCache(
            secondRevisionID,
            DocPatch.repoDir + '/out/' + DocPatch.prefix + secondRevisionID + '.txt',
            'text',
            false
        );
        
        secondRevisionTitle = DocPatch.meta.revisions[secondRevision].title;
        secondRevisionAnnounced = $.datepicker.formatDate(DocPatch.dateFormat, new Date(DocPatch.meta.revisions[secondRevision].announced));
    }

    dmp.Diff_Timeout = 1.0;
    dmp.Diff_EditCost = 4.0;

    var d = dmp.diff_main(firstText, secondText);
    //dmp.diff_cleanupSemantic(d);
    //dmp.diff_cleanupEfficiency(d);
    var comparisionOutput = dmp.diff_prettyHtml(d);
    
    $('#compareModalLabel').html('Fassung &bdquo;<span class="highlightfirstrevision">' + firstRevisionTitle + '</span>&rdquo; (' + firstRevisionAnnounced + ') verglichen mit Fassung &bdquo;<span class="highlightsecondrevision">' + secondRevisionTitle + '</span>&rdquo; (' + secondRevisionAnnounced + ')');

    $('#compareModal .modal-body').html(comparisionOutput);
    
    $('#compareModal').modal();
}

/**
 * Creates unique revision identifier.
 *
 * @param object revision Revision
 *
 * @return string
 */
DocPatch.createRevisionID = function(revision) {
    return revision.id + '_' + revision.announced;
}

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
DocPatch.fetchOrCache = function(key, uri, type, async) {
    if (localStorage) {
        var value = localStorage.getItem(key);
        
        if (!value) {
            $.ajax({
                url: uri,
                dataType: type,
                async: async
            }).done(function(response) {
                value = response;
                
                if (type == 'json') {
                    response = JSON.stringify(response);
                }
                
                localStorage.setItem(key, response);
            });
        } else if (type == 'json') {
            value = JSON.parse(value);
        }
        
        return value;
    } else {
        $.ajax({
            url: uri,
            dataType: type,
            async: async
        }).done(function(response) {
            return response;
        });
    }
}

/**
 * Collects meta data for a revision. Output is formatted for being processed by DocPatch.formatMeta().
 *
 * @param object revision Revision
 *
 * @return string
 */
DocPatch.collectMetaData = function(revision) {
    var collectedMetaData = [];
    var year;
    
    if (revision.passed) {
        var passed = new Date(revision.passed);
        year = $.datepicker.formatDate('yy', passed);
        
        collectedMetaData.push({
            key: 'Verabschiedet',
            value: '<a href="http://de.wikipedia.org/wiki/' + year + '" title="' + year + ' (Wikipedia)">' + $.datepicker.formatDate(DocPatch.dateFormat, passed) + '</a>'
        });
    }
    
    if (revision.date) {
        var date = new Date(revision.date);
        year = $.datepicker.formatDate('yy', date);
        
        collectedMetaData.push({
            key: 'Gesetz vom',
            value: '<a href="http://de.wikipedia.org/wiki/' + year + '" title="' + year + ' (Wikipedia)">' + $.datepicker.formatDate(DocPatch.dateFormat, date) + '</a>'
        });
    }
    
    if (revision.announced) {
        var announced = new Date(revision.announced);
        year = $.datepicker.formatDate('yy', announced);
        
        collectedMetaData.push({
            key: 'Angekündigt',
            value: '<a href="http://de.wikipedia.org/wiki/' + year + '" title="' + year + ' (Wikipedia)">' + $.datepicker.formatDate(DocPatch.dateFormat, announced) + '</a>'
        });
    }
    
    if (revision.effectiveSince) {
        var effectiveSince = new Date(revision.effectiveSince);
        year = $.datepicker.formatDate('yy', effectiveSince);
        
        collectedMetaData.push({
            key: 'Inkraftgetreten am',
            value: '<a href="http://de.wikipedia.org/wiki/' + year + '" title="' + year + ' (Wikipedia)">' + $.datepicker.formatDate(DocPatch.dateFormat, effectiveSince) + '</a>'
        });
    }
    
    if (revision.articles) {
        var articles = [];
        
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
            value: '<a href="javascript:DocPatch.compareRevisions(\'' + DocPatch.previousRevisionID + '\', \'' + revision.id + '\')" title="">' + articles.join('; ') + '</a>'
        });
    }
    
    if (revision.signedOffBy) {
        var signedOffBy = [];
        
        $.each(revision.signedOffBy, function() {
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
        var sources = [];
        
        $.each(revision.sources, function() {
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
        var votes = [];
        
        if (revision.votes.yes) {
            votes.push(
                revision.votes.yes + ' Ja-Stimme' + (revision.votes.yes != 1 ? 'n' : '')
            );
        }
        
        if (revision.votes.no) {
            votes.push(
                revision.votes.no + ' Nein-Stimme' + (revision.votes.no != 1 ? 'n' : '')
            );
        }
        
        if (revision.votes.abstentions) {
            votes.push(
                revision.votes.abstentions + ' Enthaltung' + (revision.votes.abstentions != 1 ? 'en' : '')
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
    
    DocPatch.previousRevisionID = revision.id;
    
    return collectedMetaData;
}

/**
 * Formats meta data for a revision. Used for the timeline.
 *
 * @param object revision Revision
 *
 * @return string HTML formatted output
 */
DocPatch.formatMeta = function(revision) {
    var formatted;
    
    formatted = '<table>';
    
    var collectedMetaData = DocPatch.collectMetaData(revision);
    
    $.each(collectedMetaData, function() {
        formatted += '<tr><th>' + this.key + ':</th><td>' + this.value + '</td></tr>';
    });
    
    formatted += '</table>';
    
    return formatted;
}

/**
 * Draws table for statistics about actors.
 */
DocPatch.drawActorsTable = function() {
    if (!DocPatch.drawActorsTable) {
        DocPatch.drawActorsTable = 0;
    }

    if (DocPatch.drawActorsTable === 1) {
        return;
    }

    var actors = {};

    $.each(DocPatch.meta.revisions, function() {
        if (this.signedOffBy) {
            $.each(this.signedOffBy, function() {
                if (actors[this.uri]) {
                    actors[this.uri].number++;
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

    var entities = [];

    for (var i in actors) {
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

    DocPatch.drawActorsTable = 1;
}

/**
 * Draws table for statistics about articles.
 */
DocPatch.drawArticlesTable = function() {
    if (!DocPatch.drawArticlesTable) {
        DocPatch.drawArticlesTable = 0;
    }

    if (DocPatch.drawArticlesTable === 1) {
        return;
    }

    var articles = {};

    $.each(DocPatch.meta.revisions, function() {
        var version = this.id + 1;

        if (this.articles) {
            $.each(this.articles, function(key, value) {
                $.each(value, function() {
                    if (!articles[this]) {
                        articles[this] = {};
                        articles[this].numberOfChanges = 0;
                        articles[this].history = {};
                    }

                    articles[this].numberOfChanges++;

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

    var entities = [];
    
    $.each(articles, function(key, value) {
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

    DocPatch.drawArticlesTable = 1;
}
