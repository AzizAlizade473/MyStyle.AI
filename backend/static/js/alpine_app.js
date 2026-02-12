document.addEventListener('alpine:init', () => {
    Alpine.data('globalState', () => ({
        // 1. Current Language (Load from browser memory or default to 'en')
        lang: localStorage.getItem('app_lang') || 'en',

        // 2. The Dictionary
        dictionary: {
            en: { 
                app_title: "Style,\nSimplified.",
                app_desc: "Your personalized AI stylist. Digitalize your wardrobe, find matches from local boutiques, and elevate your daily look.",
                auth_subtitle: "Your Personal AI Stylist.", 
                welcome: "Welcome",
                sign_up: "Sign Up",
                create_account: "Create", 
                no_account: "New member? Sign Up", 
                has_account: "Member? Sign In", 
                hello_user: "Hi, ", 
                weather_tip: "Rain alert. Trench coat recommended.", 
                snap_match: "Snap & Match", 
                snap_desc: "Visual Styling", 
                paste_link: "Paste Link", 
                write_prompt: "Write Prompt", 
                recent_history: "Recent Matches", 
                wardrobe: "Wardrobe",
                dashboard: "Home", 
                profile: "Profile",
                items: "items",
                all: "All", 
                cat_top: "Tops", 
                cat_pants: "Bottoms", 
                cat_shoes: "Shoes", 
                cat_acc: "Acc", 
                my_sizes: "My Sizes", 
                logout: "Logout", 
                next: "Continue", 
                results: "Results", 
                ai_desc: "Checking 80+ inventories...",
                finding_matches: "Finding Perfect Matches", 
                occasion_label: "Occasion", 
                vintage_label: "Include Vintage", 
                visit_shop: "Map", 
                buy_online: "Order",
                username: "Username",
                password: "Password",
                confirm_password: "Confirm Password",
                full_name: "Full Name (Optional)",
                first_name: "First Name",
                last_name: "Last Name",
                premium_member: "Premium Member",
                lang_pref: "Language Preference",
                per_info: "Personal Informations",
                prefs: "Preferences",
                currency: "Currency",
                vis_idn: "Visual Identity",
                desc_style: "Describe your style"

            },
            az: { 
                app_title: "Sadələşdirilmiş,\nStil",
                app_desc: "Fərdi Sİ stilistiniz. Qarderobunuzu rəqəmsallaşdırın, yerli butiklərdən uyğunluqlar tapın və gündəlik görünüşünüzü daha da gözəlləşdirin.",
                auth_subtitle: "Sizin AI Stilistiniz.", 
                welcome: "Xoş Gördük",
                sign_up: "Hesab Yarat",
                create_account: "Yarat", 
                no_account: "Yeni? Qeydiyyat", 
                has_account: "Üzvsən? Giriş", 
                hello_user: "Salam, ", 
                weather_tip: "Yağış yağır. Plaş məsləhətdir.", 
                snap_match: "Şəkil Çək", 
                snap_desc: "Vizual Analiz", 
                paste_link: "Link", 
                write_prompt: "Yazı", 
                recent_history: "Son Aktivlik", 
                wardrobe: "Qarderob", 
                dashboard: "Ana Ekran", 
                profile: "Profil",
                items: "geyim", 
                all: "Hamısı", 
                cat_top: "Üst", 
                cat_pants: "Şalvar", 
                cat_shoes: "Ayaqqabı", 
                cat_acc: "Aksesuar", 
                my_sizes: "Ölçülərim", 
                logout: "Çıxış", 
                next: "Davam Et", 
                results: "Nəticələr", 
                ai_desc: "80+ mağaza taranır...",
                finding_matches: "Mükəmməl Uyğunluqlar Tapılır", 
                occasion_label: "Məkan", 
                vintage_label: "Vintage", 
                visit_shop: "Xəritə", 
                buy_online: "Sifariş",
                username: "İstifadəçi adı",
                password: "Şifrə",
                confirm_password: "Şifrəni Təsdiqlə",
                full_name: "Tam Adınız (İstəyə bağlı)",
                first_name: "Ad",
                last_name: "Soyad",
                premium_member: "Premium İstifadəçi",
                lang_pref: "Dil Seçimim",
                per_info: "Şəxsi Məlumatlarım",
                prefs: "Seçimlərim",
                currency: "Valyuta",
                vis_idn: "Visual Kimlik",
                desc_style: "Stilini Ifadə Et"
            }
        },
        
        size_options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
        currentPage: "",

        init() {
            // Watcher: Whenever 'lang' changes, save it to LocalStorage automatically
            this.$watch('lang', (val) => {
                localStorage.setItem('app_lang', val);
            });
        },

        // 4. TRANSLATE FUNCTION
        t(key) {
            // Safety check: if dictionary is missing key, return the key itself
            try {
                return this.dictionary[this.lang][key] || key;
            } catch (e) {
                return key;
            }
        },

        // 5. CHANGE LANGUAGE
        setLang(val) {
            this.lang = val; 
            // The $watch above handles the saving!
        },

        setPage(page){
            this.currentPage = page;
            console.log(this.currentPage);
        },

        // 6. CHECK ACTIVE
        is(val) {
            return this.lang === val;
        }
    }));

    // Image Search Component
    Alpine.data('imageSearchComponent', () => ({
        step: 'input',
        userInput: '',
        selectedStyle: null,
        isVintageMode: false,
        isHyperLocal: false,
        stylingOwnedItem: null,
        targetCategory: null,
        closetMatches: [],
        filteredResults: [],
        allResults: [],
        lang: localStorage.getItem('app_lang') || 'en',
        styles: ['Casual', 'Date Night', 'Business', 'Night Out'],

        categories: [
            { id: 'Shirt', key: 'cat_top', icon: 'fas fa-shirt' },
            { id: 'Trousers', key: 'cat_pants', icon: 'fas fa-pants' },
            { id: 'Shoes', key: 'cat_shoes', icon: 'fas fa-shoe-prints' },
            { id: 'Accessories', key: 'cat_acc', icon: 'fas fa-ring' }
        ],

        t(key) {
            const translations = {
                en: {
                    cat_top: "Tops",
                    cat_pants: "Bottoms",
                    cat_shoes: "Shoes",
                    cat_acc: "Acc",
                    next: "Continue",
                    finding_matches: "Finding Perfect Matches",
                    ai_desc: "Checking 80+ inventories..."
                },
                az: {
                    cat_top: "Üst",
                    cat_pants: "Şalvar",
                    cat_shoes: "Ayaqqabı",
                    cat_acc: "Aksesuar",
                    next: "Davam Et",
                    finding_matches: "Mükəmməl Uyğunluqlar Tapılır",
                    ai_desc: "80+ mağaza taranır..."
                }
            };
            try {
                return translations[this.lang][key] || key;
            } catch (e) {
                return key;
            }
        },

        init() {
            const params = new URLSearchParams(window.location.search);
            const itemId = params.get('item');
            if (itemId) {
                this.loadOwnedItem(itemId);
            }
        },

        loadOwnedItem(itemId) {
            const token = localStorage.getItem('userToken');
            if (!token) return;

            fetch(`/api/core/items/${itemId}/`, {
                headers: { 'Authorization': `Token ${token}` }
            })
                .then(r => r.json())
                .then(data => {
                    this.stylingOwnedItem = data;
                })
                .catch(err => console.error('Error loading item:', err));
        },

        selectTargetCategory(categoryId) {
            this.targetCategory = categoryId;
            this.step = 'loading';
            this.performSearch();
        },

        performSearch() {
            const token = localStorage.getItem('userToken');
            if (!token) {
                window.location.href = '/login/';
                return;
            }

            const params = new URLSearchParams({
                query: this.userInput,
                category: this.targetCategory,
                occasion: this.selectedStyle || '',
                include_vintage: this.isVintageMode,
                hyper_local: this.isHyperLocal
            });

            fetch(`/api/core/style-image-search/?${params}`, {
                headers: { 'Authorization': `Token ${token}` }
            })
                .then(r => {
                    if (!r.ok) throw new Error('Search failed');
                    return r.json();
                })
                .then(data => {
                    this.allResults = data.results || [];
                    this.closetMatches = data.closet_matches || [];
                    this.filteredResults = this.allResults;
                    this.step = 'results';
                })
                .catch(err => {
                    console.error('Search error:', err);
                    this.step = 'input';
                });
        },

        openDetail(item, isOwnedItem = false) {
            sessionStorage.setItem('selectedItem', JSON.stringify(item));
            if (isOwnedItem) {
                window.location.href = `/profile/?item=${item.id}`;
            } else {
                console.log('Opening detail for:', item);
            }
        },

        vibeCheck() {
            alert('Vote to help improve recommendations!');
            console.log('Vibe Check - Current results:', this.filteredResults);
        }
    }));
});