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
                vis_idn: "Visual Identity"

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
                vis_idn: "Visual Kimlik"
            }
        },
        
        init() {
            console.log("Language initialized:", this.lang);
            
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

        // 6. CHECK ACTIVE
        is(val) {
            return this.lang === val;
        }
    }));
});