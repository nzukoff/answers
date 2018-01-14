var VoiceResponse = require('twilio').twiml.VoiceResponse;
var SurveyResponse = require('../models/SurveyResponse');
var survey = require('../survey_data');

// Main interview loop
exports.interview = function(request, response) {
    var phone = request.body.From;
    var input = request.body.RecordingUrl;
    var twiml = new VoiceResponse();

    // helper to append a new "Say" verb with alice voice
    function say(text) {
        twiml.say({ voice: 'alice'}, text);
    }

    // respond with the current TwiML content
    function respond() {
        response.type('text/xml');
        response.send(twiml.toString());
        console.log("RESPONDED")
    }

    // Find an in-progess survey if one exists, otherwise create one
    SurveyResponse.advanceSurvey({
        phone: phone,
        input: input,
        survey: survey
    }, function(err, surveyResponse, questionIndex) {
        console.log("SURVEY RESPONSE 1 IS ", surveyResponse)
        var question = survey[questionIndex];
        console.log("SURVEY RESPONSE ID IS ", surveyResponse._id)

        if (err || !surveyResponse) {
            say('Terribly sorry, but an error has occurred. Goodbye.');
            return respond();
        }

        // If question is null, we're done!
        if (!question) {
            say('Thanks!');
            return respond();
        }

        // Add a greeting if this is the first question
        if (questionIndex === 0) {
            say('We are wondering');
        }

        // Otherwise, ask the next question
        twiml.play(question.url);

        // Depending on the type of question, we either need to get input via
        // DTMF tones or recorded speech
        if (question.type === 'recording') {
            console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
            twiml.record({
                playBeep: false,
                timeout: 5,
                recordingStatusCallback: '/voice/' + surveyResponse._id
                    + '/status/' + questionIndex,
                maxLength: 1800
            });
        } 

        // render TwiML response
        respond();
    });
};

exports.duration = function(request, response) {
    var responseId = request.params.responseId;
    console.log("RESPONSE ID IS ", responseId)
    var questionIndex = request.params.questionIndex;
    SurveyResponse.findById(responseId, function(err, surveyResponse) {
        console.log("SURVEY RESPONSE 2 IS ", surveyResponse)
        if (err || !surveyResponse ||
            !surveyResponse.responses[questionIndex])
            return response.status(500).end();

        // Update appropriate answer field
        surveyResponse.responses[questionIndex].duration = request.body.RecordingDuration;
        surveyResponse.markModified('responses');
        surveyResponse.save(function(err, doc) {
            return response.status(err ? 500 : 200).end();
        });
    });
}

// // Transcripton callback - called by Twilio with transcript of recording
// // Will update survey response outside the interview call flow
// exports.transcription = function(request, response) {
//     var responseId = request.params.responseId;
//     var questionIndex = request.params.questionIndex;
//     var transcript = request.body.TranscriptionText;

//     SurveyResponse.findById(responseId, function(err, surveyResponse) {
//         if (err || !surveyResponse ||
//             !surveyResponse.responses[questionIndex])
//             return response.status(500).end();

//         // Update appropriate answer field
//         surveyResponse.responses[questionIndex].answer = transcript;
//         surveyResponse.markModified('responses');
//         surveyResponse.save(function(err, doc) {
//             return response.status(err ? 500 : 200).end();
//         });
//     });
// };
