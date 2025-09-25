class LoginController {
    constructor() {
        this.form = document.getElementById('loginForm');
        this.countrySelect = document.getElementById('country');
        this.initializeEventListeners();
        this.loadCountries();
    }

    initializeEventListeners() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    async loadCountries() {
        try {
            const response = await fetch('http://localhost:5000/countries');
            const countries = await response.json();
            
            // Convertir el array de objetos a un array de {id, name}
            const formattedCountries = countries.reduce((acc, country) => {
                const [code, name] = Object.entries(country)[0];
                acc.push({
                    id: code,
                    name: name
                });
                return acc;
            }, []);
            
            // Ordenar países alfabéticamente por nombre
            formattedCountries.sort((a, b) => a.name.localeCompare(b.name));
            
            this.populateCountrySelect(formattedCountries);
        } catch (error) {
            console.error('Error loading countries:', error);
            alert('Error loading countries. Please try again later.');
        }
    }

    populateCountrySelect(countries) {
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Elegir un país';
        defaultOption.disabled = true;
        defaultOption.selected = true;
        this.countrySelect.appendChild(defaultOption);

        countries.forEach(country => {
            const option = document.createElement('option');
            option.value = country.id;
            option.textContent = country.name;
            this.countrySelect.appendChild(option);
        });
    }

    handleSubmit(e) {
        e.preventDefault();
        
        try {
            const userData = this.getUserData();
            if (this.validateForm(userData)) {
                this.saveUserData(userData);
                this.redirectToGame();
            }
        } catch (error) {
            console.error('Error in form submission:', error);
            alert('An error occurred. Please try again.');
        }
    }

    getUserData() {
        return {
            username: document.getElementById('username').value.trim(),
            country: document.getElementById('country').value,
            color: document.getElementById('color').value,
            token: document.getElementById('token').value
        };
    }

    validateForm(data) {
        if (!data.username || !data.country || !data.color || !data.token) {
            alert('Please fill in all fields');
            return false;
        }
        return true;
    }

    saveUserData(userData) {
        localStorage.setItem('userData', JSON.stringify(userData));
    }

    redirectToGame() {
        window.location.href = 'board.html';
    }
}

// Initialize controller
document.addEventListener('DOMContentLoaded', () => {
    new LoginController();
});