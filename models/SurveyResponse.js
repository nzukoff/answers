var mongoose = require('mongoose');
// Define survey response model schema
var SurveyResponseSchema = new mongoose.Schema({
    // phone number of participant
    phone: String,
    time : { type : Date, default: Date.now },
    // status of the participant's current survey response
    complete: {
        type: Boolean,
        default: false
    },
    // record of answers
    responses: [mongoose.Schema.Types.Mixed]
},{
    usePushEach: true
});

// For the given phone number and survey, advance the survey to the next
// question
SurveyResponseSchema.statics.advanceSurvey = function(args, cb) {
    var surveyData = args.survey;
    var phone = args.phone;
    var input = args.input;
    var surveyResponse;

    // Find current incomplete survey
    SurveyResponse.findOne({
        phone: phone,
        complete: false
    }, function(err, doc) {
        console.log("DOC IS ",doc)
        surveyResponse = doc || new SurveyResponse({
            phone: phone
        });
        surveyResponse.save(function (err) {
            if (err) console.log("SAVE ERROR IS ", err)})
        console.log("NEW SURVEY RESPONSE IS ", surveyResponse)
        processInput();
    });

    // fill in any answer to the current question, and determine next question
    // to ask
    function processInput() {
        // If we have input, use it to answer the current question
        var responseLength = surveyResponse.responses.length
        var currentQuestion = surveyData[responseLength];

        // if there's a problem with the input, we can re-ask the same question
        function reask() {
            cb.call(surveyResponse, null, surveyResponse, responseLength);
        }

        // If we have no input, ask the current question again
        if (!input) {
            return reask();
        }

        // Otherwise use the input to answer the current question
        var questionResponse = {};
        if (input.indexOf('http') === 0) {
            questionResponse.recordingUrl = input;
            // input is a recording URL
            
        } else {
            // otherwise store raw value
            questionResponse.answer = input;
        }

        // Save type from question
        questionResponse.type = currentQuestion.type;
        questionResponse.time = new Date().toString();
        questionResponse.currentQuestion = currentQuestion.url;
        surveyResponse.responses.push(questionResponse);

        // If new responses length is the length of survey, mark as done
        if (surveyResponse.responses.length === surveyData.length) {
            surveyResponse.complete = true;
        }

        // Save response
        surveyResponse.save(function(err) {
            if (err) {
                console.log("HERES THE ERROR 2")
                reask();
            } else {
                console.log("RESPONSE LENGTH IN SURVEY RESPONSE IS ", responseLength)
                cb.call(surveyResponse, err, surveyResponse, responseLength+1);
            }
        });
    }
};

// Export model
delete mongoose.models.SurveyResponse
delete mongoose.modelSchemas.SurveyResponse
var SurveyResponse = mongoose.model('SurveyResponse', SurveyResponseSchema);
module.exports = SurveyResponse;
