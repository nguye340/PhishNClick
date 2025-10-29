
function showComboMessage(posX,posY, comboValue){
    $(".comboMessage")
        .html(`COMBO ${comboValue}!`)
        .css("top", posY)
        .css("left", posX)
        .css("display", "block");
    
    let x = setTimeout(hideComboMessage, 1000);
    debugLog("show");
}

function hideComboMessage(){
    debugLog("hide");
    $(".comboMessage").css("display", "none");
}

function displayProgressOnProgressBar(percent){
    $("#roundProgress").css("width", `${percent}%`)
    .attr("aria-valuenow", percent)
    .text(`${percent}%`);
    changeProgressBarColor(percent)
}

function changeProgressBarColor(percent) {
    let colorValue = "rgb(189, 0, 0)";

    if (percent >= 90) {
        colorValue = "rgb(51, 219, 0)";
    }
    else if (percent >= 80){
        colorValue = "rgb(252, 172, 0)"
    }
    $("#roundProgress").css("background-color", colorValue);
}

function displayEndScreen(pointsHandler, totalSuccessfulHits, accuracy, totalShots, emailsEscaped){
    // Basic stats
    $("#pointsSummary").text(pointsHandler.pointsNumber);
    $("#roundSummary").text(pointsHandler.level);
    $("#shotsSummary").text(totalSuccessfulHits);
    $("#accuracySummary").text(`${accuracy}%`);
    $("#totalShotsSummary").text(totalShots || 0);
    $("#emailsEscapedSummary").text(emailsEscaped || 0);
    
    // Generate security assessment
    generateSecurityAssessment(accuracy, totalSuccessfulHits, pointsHandler.level, emailsEscaped);
    
    // Generate improvement tips
    generateImprovementTips(accuracy, totalSuccessfulHits, emailsEscaped);
    
    // Initialize page navigation
    initializePageNavigation();
    
    $("#overlay").show();
}

// Initialize page navigation for game over screen
function initializePageNavigation() {
    // Show page 1 by default
    $("#reportPage1").show();
    $("#reportPage2").hide();
    
    // Next page button
    $("#nextPageButton").off('click').on('click', function() {
        $("#reportPage1").hide();
        $("#reportPage2").show();
    });
    
    // Previous page button
    $("#prevPageButton").off('click').on('click', function() {
        $("#reportPage2").hide();
        $("#reportPage1").show();
    });
}

// Show enlarged email when malicious duck is successfully shot
function showEnlargedEmail(emailData) {
    // Pause the game when modal opens
    if (typeof window.gameInstance !== 'undefined' && window.gameInstance.pauseGame) {
        window.gameInstance.pauseGame();
    }
    
    const enlargedContent = $("#enlargedEmailContent");
    
    enlargedContent.html(`
        <div style="margin-bottom: 15px; font-family: 'Courier New', monospace;">
            <div style="color: #ffd700; font-weight: bold; margin-bottom: 8px; font-size: 16px; text-transform: uppercase;">From:</div>
            <div style="color: #ffffff; margin-bottom: 15px; padding: 12px; background: #2a2a3e; border-radius: 5px; font-size: 14px; font-family: 'Courier New', monospace; word-break: break-all;">${emailData.from || 'Unknown Sender'}</div>
        </div>
        <div style="margin-bottom: 15px; font-family: 'Courier New', monospace;">
            <div style="color: #ffd700; font-weight: bold; margin-bottom: 8px; font-size: 16px; text-transform: uppercase;">Subject:</div>
            <div style="color: #ffffff; margin-bottom: 15px; padding: 12px; background: #2a2a3e; border-radius: 5px; font-size: 14px; font-family: 'Courier New', monospace; line-height: 1.4;">${emailData.subject || 'No Subject'}</div>
        </div>
        <div style="margin-bottom: 15px; font-family: 'Courier New', monospace;">
            <div style="color: #ffd700; font-weight: bold; margin-bottom: 8px; font-size: 16px; text-transform: uppercase;">Message:</div>
            <div style="color: #ffffff; padding: 15px; background: #2a2a3e; border-radius: 5px; line-height: 1.6; max-height: 200px; overflow-y: auto; font-size: 14px; font-family: 'Courier New', monospace;">${emailData.message || 'No message content'}</div>
        </div>
        <div style="margin-bottom: 15px; font-family: 'Courier New', monospace;">
            <div style="color: #ffd700; font-weight: bold; margin-bottom: 8px; font-size: 16px; text-transform: uppercase;">Threat Level:</div>
            <div style="color: #ff4757; font-weight: bold; padding: 12px; background: #2a2a3e; border-radius: 5px; border: 2px solid #ff4757; font-size: 16px; text-align: center; font-family: 'Courier New', monospace; text-transform: uppercase;">${emailData.threatLevel || 'HIGH RISK'}</div>
        </div>
        <div style="color: #00ff7f; font-size: 14px; padding: 15px; background: #1a2a1a; border-radius: 5px; border: 2px solid #00ff7f; font-family: 'Courier New', monospace; line-height: 1.6;">
            <div style="font-weight: bold; margin-bottom: 8px; color: #00ff7f; text-transform: uppercase;">Why This Is Malicious:</div>
            <div style="color: #ffffff;">${emailData.explanation || 'This email contains typical phishing indicators such as urgent language, suspicious links, or requests for personal information.'}</div>
        </div>
    `);
    
    $("#emailEnlargeModal").show();
    
    // Close modal handler
    $("#closeEnlargeModal").off('click').on('click', function() {
        $("#emailEnlargeModal").hide();
        // Resume the game when modal closes
        if (typeof window.gameInstance !== 'undefined' && window.gameInstance.resumeGame) {
            window.gameInstance.resumeGame();
        }
    });
    
    // Also close modal when clicking outside of it
    $("#emailEnlargeModal").off('click').on('click', function(e) {
        if (e.target === this) {
            $("#emailEnlargeModal").hide();
            // Resume the game when modal closes
            if (typeof window.gameInstance !== 'undefined' && window.gameInstance.resumeGame) {
                window.gameInstance.resumeGame();
            }
        }
    });
}

function generateSecurityAssessment(accuracy, successfulHits, level, emailsEscaped) {
    let assessment = "";
    
    if (accuracy >= 90) {
        assessment = "<span style='color: #00ff7f; font-weight: bold; font-family: Courier New, monospace;'>EXPERT CYBERSECURITY ANALYST</span><br>" +
                    "<span style='color: #ffffff; font-family: Courier New, monospace;'>Your precision in identifying phishing threats is exceptional! You demonstrate advanced threat detection skills.</span>";
    } else if (accuracy >= 75) {
        assessment = "<span style='color: #ffd700; font-weight: bold; font-family: Courier New, monospace;'>SKILLED SECURITY DEFENDER</span><br>" +
                    "<span style='color: #ffffff; font-family: Courier New, monospace;'>Good work! You're developing strong phishing detection abilities. Continue practicing to reach expert level.</span>";
    } else if (accuracy >= 50) {
        assessment = "<span style='color: #ff8c00; font-weight: bold; font-family: Courier New, monospace;'>DEVELOPING ANALYST</span><br>" +
                    "<span style='color: #ffffff; font-family: Courier New, monospace;'>You're learning the basics of threat identification. Focus on recognizing common phishing patterns and suspicious elements.</span>";
    } else {
        assessment = "<span style='color: #ff4757; font-weight: bold; font-family: Courier New, monospace;'>SECURITY TRAINEE</span><br>" +
                    "<span style='color: #ffffff; font-family: Courier New, monospace;'>Keep practicing! Cybersecurity skills take time to develop. Review phishing indicators and try again.</span>";
    }
    
    if (emailsEscaped > 10) {
        assessment += "<br><br><span style='color: #ff4757; font-weight: bold; font-family: Courier New, monospace;'>HIGH ESCAPE RATE:</span> <span style='color: #ffffff; font-family: Courier New, monospace;'>Many phishing emails escaped detection. Focus on faster threat recognition.</span>";
    } else if (emailsEscaped <= 2) {
        assessment += "<br><br><span style='color: #00ff7f; font-weight: bold; font-family: Courier New, monospace;'>LOW RISK:</span> <span style='color: #ffffff; font-family: Courier New, monospace;'>Excellent threat containment! Most phishing attempts were caught.</span>";
    }
    
    $("#securityAssessment").html(assessment);
}

function generateImprovementTips(accuracy, successfulHits, emailsEscaped) {
    let tips = "";
    
    if (accuracy < 70) {
        tips += "<span style='color: #ffd700; font-weight: bold; font-family: Courier New, monospace;'>Improve Accuracy:</span> <span style='color: #ffffff; font-family: Courier New, monospace;'>Take time to carefully aim before shooting.</span><br><br>" +
               "<span style='color: #ffd700; font-weight: bold; font-family: Courier New, monospace;'>Study Email Patterns:</span> <span style='color: #ffffff; font-family: Courier New, monospace;'>Look for suspicious sender addresses, urgent language, and grammar errors.</span><br><br>";
    }
    
    if (emailsEscaped > 5) {
        tips += "<span style='color: #ffd700; font-weight: bold; font-family: Courier New, monospace;'>Threat Recognition:</span> <span style='color: #ffffff; font-family: Courier New, monospace;'>Study email patterns and suspicious indicators to identify threats faster.</span><br><br>" +
               "<span style='color: #ffd700; font-weight: bold; font-family: Courier New, monospace;'>Quick Response:</span> <span style='color: #ffffff; font-family: Courier New, monospace;'>Practice identifying phishing emails quickly to prevent them from escaping.</span><br><br>";
    }
    
    if (successfulHits < 10) {
        tips += "<span style='color: #ffd700; font-weight: bold; font-family: Courier New, monospace;'>Target Practice:</span> <span style='color: #ffffff; font-family: Courier New, monospace;'>Focus on improving your shooting accuracy and reaction time.</span><br><br>" +
               "<span style='color: #ffd700; font-weight: bold; font-family: Courier New, monospace;'>Email Analysis:</span> <span style='color: #ffffff; font-family: Courier New, monospace;'>Click on duck emails to study their content and learn phishing patterns.</span><br><br>";
    }
    
    if (tips === "") {
        tips = "<span style='color: #ffd700; font-weight: bold; font-family: Courier New, monospace;'>Excellent Performance:</span> <span style='color: #ffffff; font-family: Courier New, monospace;'>You've mastered the basics! Try increasing the difficulty or challenge yourself with faster rounds.</span><br><br>" +
              "<span style='color: #ffd700; font-weight: bold; font-family: Courier New, monospace;'>Share Knowledge:</span> <span style='color: #ffffff; font-family: Courier New, monospace;'>Help others learn cybersecurity by sharing your threat detection skills.</span><br><br>";
    }
    
    $("#improvementTips").html(tips);
}

function disableLifeIcon(lifeNumber){
    $(`#life${lifeNumber}`).css("filter", "grayscale(100%)");
}

// Duck Email Modal Functions
function showDuckEmailModal(emailData) {
    $("#emailFrom").text(emailData.from || "unknown@suspicious.com");
    $("#emailSubject").text(emailData.subject || "Urgent Action Required");
    $("#emailMessage").html(emailData.message || "This appears to be a phishing email. Click to report it!");
    
    // Set threat level styling
    const threatLevel = emailData.threatLevel || "HIGH";
    const threatColors = {
        "HIGH": "#ff4757",
        "MEDIUM": "#ffa502",
        "LOW": "#2ed573"
    };
    
    $("#emailThreatLevel")
        .text(threatLevel)
        .css("background-color", threatColors[threatLevel] || "#ff4757")
        .css("color", "white");
    
    $("#duckEmailModal").show();
}

function hideDuckEmailModal() {
    $("#duckEmailModal").hide();
}

// Initialize modal close functionality
$(document).ready(function() {
    $("#closeEmailModal").click(hideDuckEmailModal);
    
    // Close modal when clicking outside
    $("#duckEmailModal").click(function(e) {
        if (e.target === this) {
            hideDuckEmailModal();
        }
    });
});
