ks.ready(function() {
    $('.navbar').onePageNav({
        currentClass: 'active',
        changeHash: true,
        scrollSpeed: 750,
        scrollOffset: -100
    });
    
    $.ajax({
        url: "grundgesetz-dev/etc/meta.json",
        dataType: "json"
    }).done(function(data) {
        var meta = data.reverse();

        $.each(meta, function() {
            $('#revision').append('<option value="' + this.id + '_' + this.announced + '">' + this.id + '. ' + this.title + ' (' + this.announced + ')</option>');
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
                "title": "Plain text",
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
                "headline":"Grundgesetz für die Bundesrepublik Deutschland",
                "type":"default",
                "text":"People say stuff",
                "startDate":"1949,05,23",
                "date": [
                    {
                        "startDate":"1949,05,23",
                        "endDate":"1949,05,23",
                        "headline":"Sh*t Politicians Say",
                        "text":"<p>In true political fashion, his character rattles off common jargon heard from people running for office.</p>",
                        "asset":
                        {
                            "media":"http://youtu.be/u4XpeU9erbg",
                            "credit":"",
                            "caption":""
                        }
                    }
                ]
            }
        };
        
        $.each(data, function() {
            var announced = new Date(this.announced);
            //console.log(announced.format('yyyy-MM-dd'));
            //console.log($.datepicker.formatDate('yyyy,m,d', new Date(this.announced)));
            //console.log($.datepicker.formatDate('yy-mm-dd', new Date(this.announced)));
            timelineData.timeline.date.push({
                "startDate": announced.toString('yyyy,m,d'),
                "endDate": announced.toString('yyyy,m,d'),
                "headline": this.title,
                "text":"<p>In true political fashion, his character rattles off common jargon heard from people running for office.</p>",
                "asset": {
                    "media":"http://youtu.be/u4XpeU9erbg",
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
