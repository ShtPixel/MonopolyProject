class LoginController {
    constructor() {
        this.forms = Array.from({ length: 4 }, (_, i) => document.getElementById(`loginForm${i + 1}`));
        this.startButton = document.getElementById('startGame');
        this.initializeEventListeners();
        this.loadCountries();
        this.setupColorSelectionHandlers();
    }

    initializeEventListeners() {
        this.forms.forEach(form => {
            form.addEventListener('change', () => this.validateAllForms());
        });
        this.startButton.addEventListener('click', () => this.handleGameStart());
    }

    async loadCountries() {
        try {
            const response = await fetch('http://localhost:5000/countries');
            const countries = await response.json();
            
            const formattedCountries = countries.reduce((acc, country) => {
                const [code, name] = Object.entries(country)[0];
                acc.push({ id: code, name: name });
                return acc;
            }, []);
            
            formattedCountries.sort((a, b) => a.name.localeCompare(b.name));
            
            this.forms.forEach(form => this.populateCountrySelect(form, formattedCountries));
        } catch (error) {
            console.error('Error loading countries:', error);
            alert('Error loading countries. Please try again later.');
        }
    }

    validateAllForms() {
        const filledForms = this.forms.filter(form => this.isFormFilled(form));
        this.startButton.disabled = filledForms.length < 2;
    }

    isFormFilled(form) {
        const formData = this.getFormData(form);
        return Object.values(formData).every(value => value !== '');
    }

    setupColorSelectionHandlers() {
        const colorRadios = document.querySelectorAll('.color-radio');
        colorRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                if (radio.checked) {
                    this.updateAvailableColors();
                }
                this.validateAllForms();
            });
        });
    }

    updateAvailableColors() {
        // Primero, habilitamos todos los colores
        const allColorRadios = document.querySelectorAll('.color-radio');
        allColorRadios.forEach(radio => {
            radio.disabled = false;
        });

        // Luego, obtenemos los colores seleccionados
        const selectedColors = new Set();
        this.forms.forEach(form => {
            const selectedRadio = form.querySelector('.color-radio:checked');
            if (selectedRadio) {
                selectedColors.add(selectedRadio.value);
            }
        });

        // Finalmente, deshabilitamos los colores ya seleccionados
        allColorRadios.forEach(radio => {
            if (selectedColors.has(radio.value) && !radio.checked) {
                radio.disabled = true;
            }
        });
    }

    resetColorSelection() {
        const allColorRadios = document.querySelectorAll('.color-radio');
        allColorRadios.forEach(radio => {
            radio.disabled = false;
            radio.checked = false;
        });
    }

    getFormData(form) {
        return {
            username: form.querySelector('[id^="username"]').value.trim(),
            country: form.querySelector('[id^="country"]').value,
            color: form.querySelector('.color-radio:checked')?.value || ''
        };
    }

    handleGameStart() {
        const players = this.forms
            .map(form => this.getFormData(form))
            .filter(data => Object.values(data).every(value => value !== ''));

        if (players.length >= 2) {
            localStorage.setItem('playersData', JSON.stringify(players));
            window.location.href = 'board.html';
        }
    }

    populateCountrySelect(form, countries) {
        const countrySelect = form.querySelector('[id^="country"]');
        countrySelect.innerHTML = ''; // Clear existing options

        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Elegir un país';
        defaultOption.disabled = true;
        defaultOption.selected = true;
        countrySelect.appendChild(defaultOption);

        countries.forEach(country => {
            const option = document.createElement('option');
            option.value = country.id;
            option.textContent = country.name;
            countrySelect.appendChild(option);
        });
    }
}

// Initialize controller
document.addEventListener('DOMContentLoaded', () => {
    new LoginController();
});