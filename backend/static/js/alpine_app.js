document.addEventListener('alpine:init', () => {
    Alpine.data('globalState', () => ({
        // 1. Current Language (Load from browser memory or default to 'en')
        lang: localStorage.getItem('app_lang') || 'en',

        // 2. The Dictionary
        dictionary: {
            en: { 
                auth_subtitle: "Your Personal AI Stylist.", 
                sign_in: "Sign In", 
                create_account: "Create", 
                no_account: "New member? Sign Up", 
                has_account: "Member? Sign In", 
                hello_user: "Hi, Style Icon", 
                weather_tip: "Rain alert. Trench coat recommended.", 
                snap_match: "Snap & Match", 
                snap_desc: "Visual Styling", 
                paste_link: "Paste Link", 
                write_prompt: "Write Prompt", 
                recent_history: "Recent Matches", 
                wardrobe: "Wardrobe", 
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
                password: "Password"
            },
            az: { 
                auth_subtitle: "Sizin AI Stilistiniz.", 
                sign_in: "Daxil Ol", 
                create_account: "Yarat", 
                no_account: "Yeni? Qeydiyyat", 
                has_account: "Üzvsən? Giriş", 
                hello_user: "Salam, Stil İkonu", 
                weather_tip: "Yağış yağır. Plaş məsləhətdir.", 
                snap_match: "Şəkil Çək", 
                snap_desc: "Vizual Analiz", 
                paste_link: "Link", 
                write_prompt: "Yazı", 
                recent_history: "Son Aktivlik", 
                wardrobe: "Qarderob", 
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
                password: "Şifrə"
            }
        },

        // 3. Helper Function to Get Text
        // Usage in HTML: <span x-text="t('sign_in')"></span>
        t(key) {
            // Returns the translation, or the key itself if missing
            return this.dictionary[this.lang][key] || key;
        },

        // 4. Function to Change Language
        setLang(val) {
            this.lang = val;
            localStorage.setItem('app_lang', val);
        },

        // 5. Helper to check current language (for active buttons)
        is(val) {
            return this.lang === val;
        }
    }));
});