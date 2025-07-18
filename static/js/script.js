document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('predictionForm');
    const resultDiv = document.getElementById('result');
    const loadingOverlay = document.getElementById('loadingOverlay');

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        makePrediction();
    });

    const inputs = form.querySelectorAll('input[type="number"]');
    inputs.forEach(input => {
        input.addEventListener('input', function() {
            validateInput(this);
        });
    });

    function validateInput(input) {
        const value = parseFloat(input.value);
        const min = parseFloat(input.getAttribute('min'));
        const max = parseFloat(input.getAttribute('max'));

        input.classList.remove('error');
        
        if (value < min || value > max) {
            input.classList.add('error');
            showTooltip(input, `Value must be between ${min} and ${max}`);
        } else {
            hideTooltip(input);
        }
    }

    function showTooltip(element, message) {
        hideTooltip(element);
        
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = message;
        tooltip.style.cssText = `
            position: absolute;
            background: #f56565;
            color: white;
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 0.8em;
            z-index: 1000;
            margin-top: 5px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        `;
        
        element.parentNode.appendChild(tooltip);
        element.setAttribute('data-tooltip', 'true');
    }

    function hideTooltip(element) {
        const tooltip = element.parentNode.querySelector('.tooltip');
        if (tooltip) {
            tooltip.remove();
        }
        element.removeAttribute('data-tooltip');
    }

    async function makePrediction() {
        const formData = new FormData(form);
        const data = {
            lime: parseFloat(formData.get('lime')),
            sand: parseFloat(formData.get('sand')),
            clay: parseFloat(formData.get('clay'))
        };

        if (!validateFormData(data)) {
            return;
        }

        showLoading();

        try {
            const response = await fetch('/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                displaySuccess(result);
            } else {
                displayError(result.error || 'An error occurred');
            }
        } catch (error) {
            console.error('Error:', error);
            displayError('Failed to connect to server. Please try again.');
        } finally {
            hideLoading();
        }
    }

    function validateFormData(data) {
        const errors = [];

        if (isNaN(data.lime) || isNaN(data.sand) || isNaN(data.clay)) {
            errors.push('Please fill in all fields with valid numbers');
        }

        if (data.lime < 0 || data.lime > 100) {
            errors.push('Lime percentage must be between 0 and 100');
        }
        if (data.sand < 0 || data.sand > 100) {
            errors.push('Sand percentage must be between 0 and 100');
        }
        if (data.clay < 0 || data.clay > 100) {
            errors.push('Clay percentage must be between 0 and 100');
        }

        if (errors.length > 0) {
            displayError(errors.join('<br>'));
            return false;
        }

        return true;
    }

    function displaySuccess(result) {
        const prediction = result.prediction;
        const features = result.features;
        
        resultDiv.innerHTML = `
            <div class="result-success">
                <h3><i class="fas fa-check-circle"></i> Prediction Complete</h3>
                <div class="prediction-value">${prediction.toFixed(4)}</div>
                <p>Predicted Clinker Value</p>
                <div class="features-used">
                    <strong>Input Features:</strong><br>
                    Lime: ${features.lime}% | Sand: ${features.sand}% | Clay: ${features.clay}%
                </div>
            </div>
        `;
    }

    function displayError(errorMessage) {
        resultDiv.innerHTML = `
            <div class="result-error">
                <h3><i class="fas fa-exclamation-triangle"></i> Error</h3>
                <p>${errorMessage}</p>
            </div>
        `;
    }

    function showLoading() {
        loadingOverlay.style.display = 'flex';
        form.style.pointerEvents = 'none';
        form.style.opacity = '0.6';
    }

    function hideLoading() {
        loadingOverlay.style.display = 'none';
        form.style.pointerEvents = 'auto';
        form.style.opacity = '1';
    }

    const style = document.createElement('style');
    style.textContent = `
        .form-group input.error {
            border-color: #f56565;
            box-shadow: 0 0 0 3px rgba(245, 101, 101, 0.1);
        }
        .tooltip {
            animation: fadeIn 0.3s ease-out;
        }
    `;
    document.head.appendChild(style);
});
