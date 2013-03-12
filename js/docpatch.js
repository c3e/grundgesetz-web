ks.ready(function() {
    $('#topnav').onePageNav({
        currentClass: 'current',
        changeHash: false,
        scrollSpeed: 750,
        scrollOffset: -100
    });
    
    $.ajax({
        url: "grundgesetz-dev/etc/meta.json",
        dataType: "json"
    }).done(function(data) {
        var meta = data.revisions.reverse();

        $.each(meta, function() {
            $('#revision, #firstrevision, #secondrevision').append('<option value="' + this.id + '_' + this.announced + '">' + this.id + '. ' + this.title + ' (' + this.announced + ')</option>');
        });
    
        var formats = [
            {
                "title": "PDF",
                "ext": "pdf"
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
                "title": "Open Document Format (ODT)",
                "ext": "odt"
            },
            {
                "title": "Plain text (txt)",
                "ext": "txt"
            }
        ];
        
        $.each(formats, function() {
            $('#format').append('<option value="' + this.ext + '">' + this.title + '</option>');
        });
        
        $('#download').attr(
            'action',
            'grundgesetz-dev/out/brd_grundgesetz_' + $('#revision').val() + '.' + $('#format').val()
        );
        
        $('#revision, #format').change(function() {
            $('#download').attr(
                'action',
                'grundgesetz-dev/out/brd_grundgesetz_' + $('#revision').val() + '.' + $('#format').val()
            );
        });
        
        $('#latest').attr(
            'href',
            'grundgesetz-dev/out/brd_grundgesetz_' + $('#revision option:first').val() + '.pdf'
        );
        
        var timelineData = {
            "timeline": {
                "headline": data.title,
                "type": "default",
                "text": data.subject,
                "startDate": "1949,5,23",
                "date": []
            }
        };
        
        var revisions = data.revisions;
        
        $.each(revisions, function() {
            var announced = new Date(this.announced);

            timelineData.timeline.date.push({
                "startDate": $.datepicker.formatDate('yy,m,d', announced),
                "endDate": $.datepicker.formatDate('yy,m,d', announced),
                "headline": this.title,
                "text":"<p>Blindtext.</p>",
                "asset": {
                    "media":"",
                    "credit":"",
                    "caption":""
                }
            });
        });
    
        createStoryJS({
            type: 'timeline',
            width: '100%',
            height: '600',
            source: timelineData,
            lang: 'de',
            css: 'Kickstrap/apps/timelinejs/css/timeline.css',
            js: 'Kickstrap/apps/timelinejs/js/timeline-min.js'
        });
    });
});
