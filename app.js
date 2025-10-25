// Конфигурация Supabase
const SUPABASE_URL = 'https://kzyhpkspychlgtegavyb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6eWhwa3NweWNobGd0ZWdhdnliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1MzQ4MzIsImV4cCI6MjA3NjExMDgzMn0.8aVlQAeAejyLtt1IAKw-dWt2R2XFSv8XAI9nVhAclaA';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Глобальные переменные
let currentUser = null;
let currentChat = null;
let allUsers = [];
let userChats = [];

// Функции для выдвижного меню
function toggleSlideMenu() {
    const menu = document.getElementById('sidebarMenu');
    const backdrop = document.getElementById('menuBackdrop') || createBackdrop();
    
    if (menu.classList.contains('active')) {
        closeSidebarMenu();
    } else {
        openSidebarMenu();
    }
}

function createBackdrop() {
    const backdrop = document.createElement('div');
    backdrop.className = 'menu-backdrop';
    backdrop.id = 'menuBackdrop';
    backdrop.onclick = closeSidebarMenu;
    document.body.appendChild(backdrop);
    return backdrop;
}

async function openSidebarMenu() {
    const menu = document.getElementById('sidebarMenu');
    const backdrop = document.getElementById('menuBackdrop') || createBackdrop();
    
    menu.classList.add('active');
    backdrop.classList.add('active');
    
    const profile = await getCurrentUserProfile();
    if (profile) {
        const avatarElement = document.getElementById('sidebarUserAvatar');
        if (profile.avatar_url) {
            avatarElement.innerHTML = `<img src="${profile.avatar_url}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
        } else {
            avatarElement.textContent = profile.first_name ? profile.first_name[0].toUpperCase() : (profile.username ? profile.username[0].toUpperCase() : 'U');
        }
        document.getElementById('sidebarUsername').textContent = profile.first_name || profile.username || 'Пользователь';
    }
    document.getElementById('sidebarUserEmail').textContent = currentUser?.email || '';
}

function closeSidebarMenu() {
    const menu = document.getElementById('sidebarMenu');
    const backdrop = document.getElementById('menuBackdrop');
    
    menu.classList.remove('active');
    if (backdrop) {
        backdrop.classList.remove('active');
    }
}

// Toast-уведомления
function showToast(message, type = 'info', duration = 4000) {
    const toastContainer = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    toast.innerHTML = `
        <div class="toast-icon">${icons[type] || icons.info}</div>
        <div class="toast-message">${message}</div>
        <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
    `;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        if (toast.parentElement) {
            toast.classList.add('hiding');
            setTimeout(() => toast.remove(), 300);
        }
    }, duration);
}

// Показать мой профиль
async function showMyProfile() {
    closeSidebarMenu();
    
    const profile = await getCurrentUserProfile();
    
    const modalHTML = `
        <div class="modal-overlay" id="myProfileModal" style="display: flex;">
            <div class="modal-content" style="max-width: 500px; max-height: 90vh; padding: 0; overflow: hidden;">
                <div class="profile-header-dynamic">
                    <!-- Красивый фон на всю аватарку -->
                    <div class="profile-background"></div>
                    
                    <!-- Кнопки в правом верхнем углу -->
                    <div style="position: absolute; top: 20px; right: 20px; display: flex; gap: 10px; z-index: 20;">
                        <button class="edit-profile-btn" onclick="showProfileSettings()" style="background: rgba(255,255,255,0.9); border: none; padding: 10px 15px; border-radius: 20px; font-weight: bold; cursor: pointer; backdrop-filter: blur(10px); white-space: nowrap;">
                            ✏️ Изменить
                        </button>
                        <button class="close-profile-btn" onclick="closeModalWithAnimation('myProfileModal')" style="background: rgba(255,255,255,0.9); border: none; width: 40px; height: 40px; border-radius: 50%; font-weight: bold; cursor: pointer; backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center; font-size: 18px;">
                            ✕
                        </button>
                    </div>
                    
                    <!-- АВАТАРКА - ОЧЕНЬ ВЫСОКАЯ И БОЛЬШАЯ -->
                    <div class="profile-avatar-dynamic-super-high" onclick="document.getElementById('avatarUpload').click()">
                        ${profile?.avatar_url ? 
                            `<img src="${profile.avatar_url}">` :
                            `<div style="width: 100%; height: 100%; border-radius: 20px; background: linear-gradient(135deg, #3498db 0%, #2980b9 100%); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 48px;">
                                ${profile?.first_name ? profile.first_name[0].toUpperCase() : (profile?.username ? profile.username[0].toUpperCase() : 'U')}
                            </div>`
                        }
                    </div>
                    <input type="file" id="avatarUpload" accept="image/*" style="display: none;" onchange="uploadAvatar(this.files[0])">
                    
                    <!-- ИМЯ РЯДОМ С АВАТАРКОЙ (ПОКАЗЫВАЕТСЯ ТОЛЬКО ПРИ СВЕРТЫВАНИИ) -->
                    <div class="avatar-name-collapsed">
                        ${profile?.first_name || 'Пользователь'}
                    </div>
                </div>
                
                <div class="profile-content-scroll" id="profileScrollContainer">
                    <!-- ТЕКСТ ПОДНЯТ ВЫШЕ -->
                    <div class="profile-top-info-super-high">
                        <h3 class="profile-name">${profile?.first_name || ''} ${profile?.last_name || ''}</h3>
                        <div class="username-copy" onclick="copyUsername('${profile?.username || 'username'}')">
                            @${profile?.username || 'username'}
                            <span class="copy-hint">📋</span>
                        </div>
                    </div>

                    <!-- ИНФОРМАЦИЯ -->
                    <div class="profile-info-new-format">
                        ${profile?.bio ? `
                        <div class="profile-info-section">
                            <div class="profile-info-label-full">О себе</div>
                            <div class="profile-info-value-full">${profile.bio}</div>
                        </div>
                        ` : ''}

                        ${profile?.phone ? `
                        <div class="profile-info-row-new">
                            <div class="profile-info-label-new">Телефон</div>
                            <div class="profile-info-value-new clickable-phone" onclick="copyPhone('${profile.phone}')">
                                ${profile.phone}
                                <span class="copy-hint-small">📋</span>
                            </div>
                        </div>
                        ` : ''}

                        <div class="profile-info-row-new">
                            <div class="profile-info-label-new">ID</div>
                            <div class="profile-info-value-new clickable-id" onclick="copyId('${currentUser.id}')">
                                ${currentUser.id.substring(0, 8)}...
                                <span class="copy-hint-small">📋</span>
                            </div>
                        </div>

                        ${profile?.birthday ? `
                        <div class="profile-info-row-new">
                            <div class="profile-info-label-new">День рождения</div>
                            <div class="profile-info-value-new">${new Date(profile.birthday).toLocaleDateString('ru-RU')}</div>
                        </div>
                        ` : ''}
                    </div>

                    <!-- Тестовый контент для проверки скролла аватарки -->
                    <div style="height: 800px; background: linear-gradient(180deg, #f8f9fa 0%, #e9ecef 100%); display: flex; align-items: center; justify-content: center; margin: 20px -15px -30px -15px; border-radius: 20px 20px 0 0;">
                        <div style="text-align: center; color: #666;">
                            <div style="font-size: 48px; margin-bottom: 15px;">⬇️</div>
                            <div>Прокрутите вниз чтобы увидеть как аватарка превращается в круг</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Обработчик скролла с новой логикой
    setTimeout(() => {
        const profileScroll = document.getElementById('profileScrollContainer');
        const avatar = document.querySelector('.profile-avatar-dynamic-super-high');
        const avatarName = document.querySelector('.avatar-name-collapsed');
        const header = document.querySelector('.profile-header-dynamic');
        
        if (profileScroll && avatar && avatarName && header) {
            profileScroll.style.overflowY = 'auto';
            
            profileScroll.addEventListener('scroll', function() {
                if (this.scrollTop > 50) {
                    // СВЕРНУТОЕ СОСТОЯНИЕ - аватарка круг + показываем имя
                    avatar.classList.add('collapsed');
                    avatarName.classList.add('visible');
                    header.classList.add('collapsed'); 
                } else {
                    // РАЗВЕРНУТОЕ СОСТОЯНИЕ - аватарка большая + скрываем имя
                    avatar.classList.remove('collapsed');
                    avatarName.classList.remove('visible');
                    header.classList.remove('collapsed');
                }
            });
        }
    }, 100);
}

// Функции для копирования
function copyPhone(phone) {
    navigator.clipboard.writeText(phone).then(() => {
        showToast(`Телефон ${phone} скопирован!`, 'success');
    }).catch(err => {
        const textArea = document.createElement('textarea');
        textArea.value = phone;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showToast(`Телефон ${phone} скопирован!`, 'success');
    });
}

function copyId(id) {
    navigator.clipboard.writeText(id).then(() => {
        showToast(`ID скопирован!`, 'success');
    }).catch(err => {
        const textArea = document.createElement('textarea');
        textArea.value = id;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showToast(`ID скопирован!`, 'success');
    });
}

// Показать профиль другого пользователя
async function showUserProfile(userId) {
    try {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
            
        if (error) throw error;
        
        const modalHTML = `
            <div class="modal-overlay" id="userProfileModal" style="display: flex;">
                <div class="modal-content" style="max-width: 500px; max-height: 90vh; padding: 0; overflow: hidden;">
                    <div class="profile-header-dynamic">
                        <!-- Красивый фон на всю аватарку -->
                        <div class="profile-background"></div>
                        
                        <!-- Кнопка закрыть для профиля другого человека -->
                        <div style="position: absolute; top: 20px; right: 20px; display: flex; gap: 10px; z-index: 20;">
                            <button class="close-profile-btn" onclick="closeModalWithAnimation('userProfileModal')" style="background: rgba(255,255,255,0.9); border: none; width: 40px; height: 40px; border-radius: 50%; font-weight: bold; cursor: pointer; backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center; font-size: 18px;">
                                ✕
                            </button>
                        </div>
                        
                        <!-- АВАТАРКА ПОДНЯТА ОЧЕНЬ ВЫСОКО - НА УРОВНЕ С КНОПКАМИ -->
                        <div class="profile-avatar-dynamic-high">
                            ${profile?.avatar_url ? 
                                `<img src="${profile.avatar_url}">` :
                                `<div style="width: 100%; height: 100%; border-radius: 20px; background: linear-gradient(135deg, #3498db 0%, #2980b9 100%); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 48px;">
                                    ${profile?.first_name ? profile.first_name[0].toUpperCase() : (profile?.username ? profile.username[0].toUpperCase() : 'U')}
                                </div>`
                            }
                        </div>
                    </div>
                    
                    <div class="profile-content-scroll" id="profileScrollContainerOther">
                        <!-- ИМЯ, ФАМИЛИЯ, USERNAME ПОДНЯТЫ ВЫСОКО - ПОД НАЧАЛО БЕЛОГО ФОНА -->
                        <div class="profile-top-info">
                            <h3 class="profile-name">${profile?.first_name || ''} ${profile?.last_name || ''}</h3>
                            <div class="username-copy" onclick="copyUsername('${profile?.username || 'username'}')">
                                @${profile?.username || 'username'}
                                <span class="copy-hint">📋</span>
                            </div>
                            ${profile?.bio ? `<div class="profile-bio">"${profile.bio}"</div>` : ''}
                        </div>

                        <!-- Информация в столбце -->
                        <div class="profile-info-vertical">
                            <div class="profile-info-item">
                                <div class="profile-info-label">Имя</div>
                                <div class="profile-info-value">${profile?.first_name || 'Не указано'}</div>
                            </div>
                            <div class="profile-info-item">
                                <div class="profile-info-label">Фамилия</div>
                                <div class="profile-info-value">${profile?.last_name || 'Не указана'}</div>
                            </div>
                            ${profile?.phone ? `
                            <div class="profile-info-item">
                                <div class="profile-info-label">Телефон</div>
                                <div class="profile-info-value">${profile.phone}</div>
                            </div>
                            ` : ''}
                            ${profile?.birthday ? `
                            <div class="profile-info-item">
                                <div class="profile-info-label">День рождения</div>
                                <div class="profile-info-value">${new Date(profile.birthday).toLocaleDateString('ru-RU')}</div>
                            </div>
                            ` : ''}
                            ${profile?.bio ? `
                            <div class="profile-info-item">
                                <div class="profile-info-label">О себе</div>
                                <div class="profile-info-value">${profile.bio}</div>
                            </div>
                            ` : ''}
                        </div>

                        <!-- Кнопка написать сообщение -->
                        <div style="padding: 20px;">
                            <button class="modal-btn primary" onclick="startPrivateChat('${profile.id}', '${profile.first_name || profile.username}')" style="width: 100%; padding: 15px; font-size: 16px;">
                                💬 Написать сообщение
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Добавляем обработчик скролла для динамического аватара
        setTimeout(() => {
            const profileScroll = document.getElementById('profileScrollContainerOther');
            const avatar = document.querySelector('.profile-avatar-dynamic-high');
            
            if (profileScroll && avatar) {
                // Включаем скролл
                profileScroll.style.overflowY = 'auto';
                
                profileScroll.addEventListener('scroll', function() {
                    if (this.scrollTop > 50) {
                        avatar.classList.add('collapsed');
                    } else {
                        avatar.classList.remove('collapsed');
                    }
                });
            }
        }, 100);
        
    } catch (error) {
        console.error('Ошибка загрузки профиля:', error);
        showToast('Ошибка загрузки профиля', 'error');
    }
}

// Функция для копирования username
function copyUsername(username) {
    navigator.clipboard.writeText(username).then(() => {
        showToast(`Username @${username} скопирован!`, 'success');
    }).catch(err => {
        // Fallback для старых браузеров
        const textArea = document.createElement('textarea');
        textArea.value = username;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showToast(`Username @${username} скопирован!`, 'success');
    });
}

// Показать настройки профиля
async function showProfileSettings() {
    closeAllModalsWithAnimation();
    
    const profile = await getCurrentUserProfile();
    
    const modalHTML = `
        <div class="modal-overlay" id="profileSettingsModal" style="display: flex;">
            <div class="modal-content" style="max-width: 500px; max-height: 90vh; overflow-y: auto;">
                <h2 class="modal-title">Редактирование профиля</h2>
                
                <!-- Аватарка -->
                <div style="text-align: center; margin-bottom: 20px;">
                    <div class="profile-avatar-large" onclick="document.getElementById('avatarUpload').click()">
                        ${profile?.avatar_url ? 
                            `<img src="${profile.avatar_url}" style="width: 100%; height: 100%; border-radius: 20px; object-fit: cover;">` :
                            `<div style="width: 100%; height: 100%; border-radius: 20px; background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 48px;">
                                ${profile?.first_name ? profile.first_name[0].toUpperCase() : (profile?.username ? profile.username[0].toUpperCase() : 'U')}
                            </div>`
                        }
                    </div>
                    <input type="file" id="avatarUpload" accept="image/jpeg,image/png,image/webp,image/gif" style="display: none;" onchange="uploadAvatar(this.files[0])">
                    <div style="color: #666; font-size: 12px;">Нажмите для загрузки аватарки (до 10MB)</div>
                </div>

                <!-- Основная информация -->
                <div style="margin-bottom: 25px;">
                    <h3 style="color: #2c3e50; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 8px;">Основная информация</h3>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #2c3e50;">Имя *</label>
                            <input type="text" class="modal-input" id="firstNameInput" value="${profile?.first_name || ''}" placeholder="Ваше имя">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #2c3e50;">Фамилия</label>
                            <input type="text" class="modal-input" id="lastNameInput" value="${profile?.last_name || ''}" placeholder="Ваша фамилия">
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 10px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #2c3e50;">Username *</label>
                        <input type="text" class="modal-input" id="usernameInput" value="${profile?.username || ''}" placeholder="username">
                    </div>
                    
                    <div style="margin-bottom: 10px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #2c3e50;">Email</label>
                        <input type="email" class="modal-input" value="${currentUser?.email || ''}" disabled style="background: #f5f5f5;">
                    </div>
                </div>

                <!-- Дополнительная информация -->
                <div style="margin-bottom: 25px;">
                    <h3 style="color: #2c3e50; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 8px;">Дополнительная информация</h3>
                    
                    <div style="margin-bottom: 10px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #2c3e50;">Телефон</label>
                        <input type="tel" class="modal-input" id="phoneInput" value="${profile?.phone || ''}" placeholder="+7 (999) 999-99-99">
                    </div>
                    
                    <div style="margin-bottom: 10px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #2c3e50;">О себе</label>
                        <textarea class="modal-input" id="bioInput" placeholder="Расскажите о себе..." style="height: 80px; resize: vertical;">${profile?.bio || ''}</textarea>
                    </div>
                    
                    <div style="margin-bottom: 10px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #2c3e50;">День рождения</label>
                        <input type="date" class="modal-input" id="birthdayInput" value="${profile?.birthday || ''}">
                    </div>
                </div>

                <div class="modal-buttons">
                    <button class="modal-btn secondary" onclick="closeModalWithAnimation('profileSettingsModal')">Отмена</button>
                    <button class="modal-btn primary" onclick="saveProfileSettings()">Сохранить</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Загрузка аватарки
async function uploadAvatar(file) {
    if (!file) return;
    
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
        showToast('Разрешены только JPEG, PNG, WebP и GIF файлы!', 'warning');
        return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
        showToast('Размер файла не должен превышать 10MB', 'warning');
        return;
    }
    
    const fileExtension = file.name.split('.').pop().toLowerCase();
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    if (!allowedExtensions.includes(fileExtension)) {
        showToast('Недопустимое расширение файла!', 'warning');
        return;
    }
    
    try {
        showToast('Загрузка аватарки...', 'info');
        
        const fileExt = file.name.split('.').pop();
        const fileName = `${currentUser.id}/avatar-${Date.now()}.${fileExt}`;
        
        const { data, error } = await supabase.storage
            .from('avatars')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: true
            });
            
        if (error) {
            if (error.message.includes('bucket')) {
                showToast('Ошибка: бакет для аватарок не настроен.', 'error');
            } else {
                throw error;
            }
            return;
        }
        
        const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);
            
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ 
                avatar_url: publicUrl,
                updated_at: new Date().toISOString()
            })
            .eq('id', currentUser.id);
            
        if (updateError) throw updateError;
        
        updateAllAvatars(publicUrl);
        
        showToast('Аватарка успешно обновлена!', 'success');
        
    } catch (error) {
        console.error('Ошибка загрузки аватарки:', error);
        showToast('Ошибка загрузки: ' + error.message, 'error');
    }
}

// Обновление аватарок
function updateAllAvatars(avatarUrl) {
    // В модальных окнах профиля
    const modalAvatars = document.querySelectorAll('.profile-avatar-large, .profile-avatar-small, #modalUserAvatar');
    modalAvatars.forEach(avatar => {
        avatar.innerHTML = `<img src="${avatarUrl}" style="width: 100%; height: 100%; border-radius: inherit; object-fit: cover;">`;
    });
    
    // В сайдбаре и меню
    document.getElementById('userAvatar').innerHTML = `<img src="${avatarUrl}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
    
    const sidebarAvatar = document.getElementById('sidebarUserAvatar');
    if (sidebarAvatar) {
        sidebarAvatar.innerHTML = `<img src="${avatarUrl}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
    }
}

// Сохранение настроек профиля
async function saveProfileSettings() {
    const firstName = document.getElementById('firstNameInput').value.trim();
    const lastName = document.getElementById('lastNameInput').value.trim();
    const username = document.getElementById('usernameInput').value.trim();
    const phone = document.getElementById('phoneInput').value.trim();
    const bio = document.getElementById('bioInput').value.trim();
    const birthday = document.getElementById('birthdayInput').value;
    
    
    if (!firstName) {
        showToast('Введите имя!', 'warning');
        return;
    }
    
    if (!username) {
        showToast('Введите username!', 'warning');
        return;
    }
    
    if (username.length < 3) {
        showToast('Username должен быть не менее 3 символов', 'warning');
        return;
    }
    
    try {
        const profile = await getCurrentUserProfile();
        if (username !== profile?.username) {
            const { data: existingUser } = await supabase
                .from('profiles')
                .select('id')
                .eq('username', username)
                .neq('id', currentUser.id)
                .single();
                
            if (existingUser) {
                showToast('Этот username уже занят!', 'warning');
                return;
            }
        }
        
        const updates = {
            first_name: firstName,
            last_name: lastName,
            username: username,
            phone: phone || null,
            bio: bio || null,
            birthday: birthday || null
        };
        
        const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', currentUser.id);
            
        if (error) {
            if (error.message.includes('updated_at')) {
                const { error: retryError } = await supabase
                    .from('profiles')
                    .update({
                        first_name: firstName,
                        last_name: lastName,
                        username: username,
                        phone: phone || null,
                        bio: bio || null,
                        birthday: birthday || null
                    })
                    .eq('id', currentUser.id);
                    
                if (retryError) throw retryError;
            } else {
                throw error;
            }
        }
        
        showToast('Профиль успешно обновлен!', 'success');
        closeModalWithAnimation('profileSettingsModal');
        
        await loadUserProfile();
        await loadUsersForSidebar();
        
    } catch (error) {
        console.error('Ошибка сохранения профиля:', error);
        showToast('Ошибка: ' + error.message, 'error');
    }
}

// Умный поиск пользователей
async function searchUsers() {
    const searchTerm = document.getElementById('searchInput').value.trim();
    
    if (searchTerm.length === 0) {
        if (allUsers.length === 0) {
            document.getElementById('chatsList').innerHTML = `
                <div class="chat-item">
                    <div class="chat-info">
                        <div class="chat-avatar">👥</div>
                        <div class="chat-details">
                            <div class="chat-name">Нет начатых чатов</div>
                            <div class="last-message">Начните общение с пользователем</div>
                        </div>
                    </div>
                </div>
            `;
            return;
        }
        
        showUserList(allUsers, 'Нет пользователей');
        return;
    }

    let searchResults = [];

    // Поиск по username (если начинается с @)
    if (searchTerm.startsWith('@')) {
        const username = searchTerm.substring(1).toLowerCase();
        const { data: users, error } = await supabase
            .from('profiles')
            .select('*')
            .ilike('username', `%${username}%`)
            .neq('id', currentUser.id)
            .limit(10);

        if (!error && users) {
            searchResults = users.map(user => ({
                ...user,
                displayName: user.first_name || user.username,
                searchType: 'username'
            }));
        }
    }
    // Поиск по номеру телефона (если есть цифры и >= 10 символов)
    else if (/\d/.test(searchTerm) && searchTerm.replace(/\D/g, '').length >= 10) {
        const phoneDigits = searchTerm.replace(/\D/g, '');
        const { data: users, error } = await supabase
            .from('profiles')
            .select('*')
            .neq('id', currentUser.id)
            .limit(10);

        if (!error && users) {
            // Ищем точное совпадение
            const exactMatches = users.filter(user => 
                user.phone && user.phone.replace(/\D/g, '').includes(phoneDigits)
            );
            
            // Ищем похожие номера (первые 3 совпадения)
            const similarMatches = users.filter(user => 
                user.phone && user.phone.replace(/\D/g, '').length >= 10
            ).slice(0, 3);

            searchResults = [...exactMatches, ...similarMatches].map(user => ({
                ...user,
                displayName: user.first_name || user.username,
                searchType: 'phone'
            }));
        }
    }
    // Поиск по имени
    else {
        const { data: users, error } = await supabase
            .from('profiles')
            .select('*')
            .or(`first_name.ilike.%${searchTerm}%,username.ilike.%${searchTerm}%`)
            .neq('id', currentUser.id)
            .limit(10);

        if (!error && users) {
            searchResults = users.map(user => ({
                ...user,
                displayName: user.first_name || user.username,
                searchType: 'name'
            }));
        }
    }

    showSearchResults(searchResults, searchTerm);
}

// Показать результаты поиска
function showSearchResults(users, searchTerm) {
    let usersHTML = '';
    
    if (users.length === 0) {
        usersHTML = `
            <div class="chat-item">
                <div class="chat-info">
                    <div class="chat-avatar">🔍</div>
                    <div class="chat-details">
                        <div class="chat-name">Ничего не найдено</div>
                        <div class="last-message">Попробуйте другой запрос</div>
                    </div>
                </div>
            </div>
        `;
    } else {
        users.forEach(user => {
            const avatarContent = user.avatar_url ? 
                `<img src="${user.avatar_url}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">` :
                user.displayName[0].toUpperCase();

            usersHTML += `
                <div class="search-result-item" onclick="handleSearchResultClick('${user.id}', '${user.displayName}')">
                    <div class="search-result-avatar">
                        ${avatarContent}
                    </div>
                    <div class="search-result-info">
                        <div class="search-result-name">${user.displayName}</div>
                        <div class="search-result-username">@${user.username}</div>
                        ${user.phone ? `<div class="search-result-phone">${user.phone}</div>` : ''}
                    </div>
                    <div class="start-chat-indicator">
                        💬 Начать чат
                    </div>
                </div>
            `;
        });
    }

    document.getElementById('chatsList').innerHTML = usersHTML;
}


// Обработка клика по результату поиска
function handleSearchResultClick(userId, username) {
    startPrivateChat(userId, username);
}

// Показать настройки приложения
function showAppSettings() {
    closeSidebarMenu();
    showToast('Настройки приложения скоро будут доступны!', 'info');
}

// Показать мои чаты
function showMyChats() {
    closeSidebarMenu();
    showToast(`У вас ${userChats.length} чатов`, 'info');
}

// Настройки внешнего вида
function showAppearanceSettings() {
    closeSidebarMenu();
    showToast('Настройки внешнего вида скоро будут доступны!', 'info');
}

// Настройки уведомлений
function showNotificationSettings() {
    closeSidebarMenu();
    showToast('Настройки уведомлений скоро будут доступны!', 'info');
}

// Закрыть модальное окно с анимацией
function closeModalWithAnimation(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        const overlay = modal.querySelector('.modal-overlay');
        const content = modal.querySelector('.modal-content');
        
        if (overlay) overlay.classList.add('closing');
        if (content) content.classList.add('closing');
        
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
}

// Закрыть все модальные окна с анимацией
function closeAllModalsWithAnimation() {
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        const overlay = modal.querySelector('.modal-overlay');
        const content = modal.querySelector('.modal-content');
        
        if (overlay) overlay.classList.add('closing');
        if (content) content.classList.add('closing');
        
        setTimeout(() => {
            modal.remove();
        }, 300);
    });
}

// Получить профиль текущего пользователя
async function getCurrentUserProfile() {
    try {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single();
            
        if (error) {
            console.error('Ошибка загрузки профиля:', error);
            return null;
        }
        return profile;
    } catch (error) {
        console.error('Ошибка загрузки профиля:', error);
        return null;
    }
}

// Отправить системное сообщение
async function sendSystemMessage(chatId, text) {
    try {
        const { error } = await supabase
            .from('messages')
            .insert([{
                chat_id: chatId,
                sender_id: currentUser.id,
                text: text,
                is_system: true
            }]);

        if (error) throw error;
        
    } catch (error) {
        console.error('❌ Ошибка отправки системного сообщения:', error);
    }
}

// Покинуть чат
async function leaveChat() {
    if (!currentChat) {
        showToast('Выберите чат для выхода', 'warning');
        return;
    }

    const modalHTML = `
        <div class="modal-overlay" id="confirmLeaveModal" style="display: flex;">
            <div class="modal-content">
                <h2 class="modal-title">Покинуть чат</h2>
                <p>Вы уверены, что хотите покинуть чат "${currentChat.name}"?</p>
                <div class="modal-buttons">
                    <button class="modal-btn secondary" onclick="closeModalWithAnimation('confirmLeaveModal')">Отмена</button>
                    <button class="modal-btn primary" onclick="confirmLeaveChat()">Покинуть</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

async function confirmLeaveChat() {
    try {
        const { error } = await supabase
            .from('chat_members')
            .delete()
            .eq('chat_id', currentChat.id)
            .eq('user_id', currentUser.id);

        if (error) throw error;

        const profile = await getCurrentUserProfile();
        const username = profile?.username || 'Пользователь';
        await sendSystemMessage(currentChat.id, `@${username} покинул(а) чат`);

        showToast('Вы покинули чат', 'success');
        closeModalWithAnimation('confirmLeaveModal');
        
        currentChat = null;
        document.getElementById('currentChatName').textContent = 'Выберите чат';
        document.getElementById('currentChatAvatar').textContent = '?';
        document.getElementById('chatStatus').textContent = 'offline';
        document.getElementById('leaveChatBtn').style.display = 'none';
        document.getElementById('messagesContainer').innerHTML = '<div class="message received">Добро пожаловать в AresGram! Найдите пользователя чтобы начать общение.</div>';
        
        await loadUserChats();
        
    } catch (error) {
        console.error('❌ Ошибка выхода из чата:', error);
        showToast('Ошибка: ' + error.message, 'error');
    }
}

// Автоматическое создание username если его нет
async function ensureUsername(userId, email) {
    try {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('username, first_name')
            .eq('id', userId)
            .single();

        if (error || !profile || !profile.username) {
            let baseUsername = 'user';
            if (profile?.first_name) {
                baseUsername = profile.first_name.toLowerCase();
            } else if (email) {
                baseUsername = email.split('@')[0];
            } else {
                baseUsername = `user${userId.substring(0, 8)}`;
            }
            
            let finalUsername = baseUsername;
            let counter = 1;
            
            while (true) {
                const { data: existing } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('username', finalUsername)
                    .neq('id', currentUser.id)
                    .single();
                
                if (!existing) break;
                
                finalUsername = `${baseUsername}${counter}`;
                counter++;
                if (counter > 100) break;
            }
            
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ 
                    username: finalUsername,
                    first_name: profile?.first_name || finalUsername
                })
                .eq('id', userId);
                
            if (!updateError) {
                console.log('✅ Создан username:', finalUsername);
                return finalUsername;
            }
        }
        return profile?.username;
    } catch (error) {
        console.error('❌ Ошибка создания username:', error);
        return `user${userId.substring(0, 8)}`;
    }
}

// Инициализация приложения
async function initApp() {
    console.log('🚀 Запуск AresGram...');
    
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
        window.location.href = 'login.html';
        return;
    }
    
    currentUser = user;
    console.log('👤 Пользователь:', user.email);
    
    document.getElementById('messageInput').disabled = false;
    document.getElementById('sendButton').disabled = false;
    
    await loadUserProfile();
    await ensureUsername(currentUser.id, currentUser.email);
    await loadUsersForSidebar();
    await loadUserChats();
    setupRealtimeSubscription();
    
    // Добавляем панель тестирования (БЕЗ автоматических уведомлений)
    addTestControlsToSidebar();
    
    checkUrlParams();
    
    console.log('✅ AresGram успешно инициализирован');
}

// Функция для ручного запроса уведомлений (только по кнопке)
// Функция для включения уведомлений с перезагрузкой
async function enableNotificationsManually() {
    if (!('Notification' in window)) {
        showToast('❌ Браузер не поддерживает уведомления', 'error');
        return false;
    }

    console.log('🔔 Текущий статус:', Notification.permission);

    // Если уже разрешено - сразу тестируем
    if (Notification.permission === 'granted') {
        showToast('✅ Уведомления уже включены!', 'success');
        testNotificationAfterEnable();
        return true;
    }

    // Если заблокировано
    if (Notification.permission === 'denied') {
        showToast('❌ Уведомления заблокированы. Разрешите в настройках браузера', 'warning');
        return false;
    }

    // Запрашиваем разрешение
    try {
        const permission = await Notification.requestPermission();
        console.log('🔔 Новый статус:', permission);
        
        if (permission === 'granted') {
            showToast('✅ Уведомления включены! Перезагружаем страницу...', 'success');
            
            // ПЕРЕЗАГРУЗКА СТРАНИЦЫ для применения настроек
            setTimeout(() => {
                window.location.reload();
            }, 1500);
            
            return true;
        } else {
            showToast('❌ Уведомления отключены', 'warning');
            return false;
        }
    } catch (error) {
        console.error('❌ Ошибка:', error);
        showToast('Ошибка настройки уведомлений', 'error');
        return false;
    }
}

// Тест уведомлений после включения
function testNotificationAfterEnable() {
    console.log('🧪 Тест после включения, статус:', Notification.permission);
    
    if (Notification.permission !== 'granted') {
        showToast('❌ Уведомления не включены. Статус: ' + Notification.permission, 'warning');
        return;
    }

    try {
        const notification = new Notification('AresGram - Тест', {
            body: '✅ Уведомления работают отлично!',
            icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%2327ae60" rx="20"/><text x="50" y="60" font-size="40" text-anchor="middle" fill="white">✓</text></svg>',
            tag: 'test'
        });
        
        notification.onclick = function() {
            window.focus();
            this.close();
        };

        notification.onshow = function() {
            showToast('✅ Тестовое уведомление отправлено!', 'success');
        };

        setTimeout(() => notification.close(), 5000);
        
    } catch (error) {
        console.error('❌ Ошибка:', error);
        showToast('❌ Ошибка: ' + error.message, 'error');
    }
}

// Упрощенная функция - все в одном с перезагрузкой
function testNotificationsOneClick() {
    console.log('🔔 Запуск теста в один клик');
    
    if (!('Notification' in window)) {
        showToast('❌ Браузер не поддерживает уведомления', 'error');
        return;
    }

    // Если уже разрешено - сразу тестируем
    if (Notification.permission === 'granted') {
        testNotificationAfterEnable();
        return;
    }

    // Если заблокировано
    if (Notification.permission === 'denied') {
        showToast('❌ Уведомления заблокированы в настройках браузера', 'warning');
        return;
    }

    // Запрашиваем разрешение
    Notification.requestPermission().then(permission => {
        console.log('🔔 Получен статус:', permission);
        
        if (permission === 'granted') {
            showToast('✅ Уведомления включены! Перезагружаем страницу...', 'success');
            
            // ПЕРЕЗАГРУЗКА для применения настроек
            setTimeout(() => {
                window.location.reload();
            }, 1000);
            
        } else {
            showToast('❌ Уведомления отключены', 'warning');
        }
    });
}

// Простая функция только для теста (без запросов)
function testSimpleNotification() {
    console.log('🧪 Простой тест, статус:', Notification.permission);
    
    if (!('Notification' in window)) {
        showToast('❌ Браузер не поддерживает уведомления', 'error');
        return;
    }

    if (Notification.permission !== 'granted') {
        showToast(`❌ Уведомления не включены. Статус: ${Notification.permission}. Используйте кнопку "Включить уведомления"`, 'warning');
        return;
    }

    try {
        const notification = new Notification('AresGram - Работает!', {
            body: '🎉 Уведомления настроены правильно!',
            icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23e74c3c" rx="20"/><text x="50" y="60" font-size="40" text-anchor="middle" fill="white">A</text></svg>'
        });
        
        notification.onclick = () => {
            window.focus();
            notification.close();
        };

        notification.onshow = () => {
            showToast('✅ Тест успешен! Уведомления работают.', 'success');
        };

        setTimeout(() => notification.close(), 4000);
        
    } catch (error) {
        console.error('❌ Ошибка:', error);
        showToast('❌ Ошибка создания уведомления', 'error');
    }
}

// Загрузка профиля пользователя
async function loadUserProfile() {
    try {
        let { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single();

        if (error) {
            const username = currentUser.email ? currentUser.email.split('@')[0] : `user${currentUser.id.substring(0, 8)}`;
            const { data: newProfile, error: createError } = await supabase
                .from('profiles')
                .insert([{ 
                    id: currentUser.id, 
                    username: username,
                    first_name: username
                }])
                .select()
                .single();
                
            if (!createError && newProfile) {
                updateAvatarDisplay(newProfile);
            }
        } else if (profile) {
            updateAvatarDisplay(profile);
        }
    } catch (error) {
        console.error('❌ Ошибка профиля:', error);
    }
}

// Обновление отображения аватарки
function updateAvatarDisplay(profile) {
    const avatarText = profile.first_name ? profile.first_name[0].toUpperCase() : (profile.username ? profile.username[0].toUpperCase() : 'U');
    
    if (profile.avatar_url) {
        document.getElementById('userAvatar').innerHTML = `<img src="${profile.avatar_url}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
    } else {
        document.getElementById('userAvatar').textContent = avatarText;
    }
}

// Загрузка пользователей для сайдбара
async function loadUsersForSidebar() {
    try {
        console.log('🔄 Загрузка пользователей для сайдбара...');
        
        const { data: userChats, error } = await supabase
            .from('chat_members')
            .select(`
                chat_id,
                chats:chat_id (
                    chat_members (
                        user:profiles!inner (id, username, first_name, avatar_url)
                    )
                )
            `)
            .eq('user_id', currentUser.id);

        if (error) {
            console.error('❌ Ошибка загрузки пользователей для сайдбара:', error);
            return;
        }

        const usersWithChats = new Map();
        
        userChats.forEach(chatItem => {
            if (chatItem.chats && chatItem.chats.chat_members) {
                chatItem.chats.chat_members.forEach(member => {
                    if (member.user && member.user.id !== currentUser.id) {
                        const displayName = member.user.first_name || member.user.username || `user${member.user.id.substring(0, 8)}`;
                        usersWithChats.set(member.user.id, {
                            ...member.user,
                            displayName: displayName
                        });
                    }
                });
            }
        });

        allUsers = Array.from(usersWithChats.values());
        console.log('✅ Пользователи с чатами загружены:', allUsers.length);
        
    } catch (error) {
        console.error('❌ Ошибка загрузки пользователей для сайдбара:', error);
        allUsers = [];
    }
}

// Загрузка ВСЕХ пользователей для модалки добавления
async function loadAllUsersForModal() {
    try {
        const { data: users, error } = await supabase
            .from('profiles')
            .select('*')
            .neq('id', currentUser.id)
            .order('first_name', { ascending: true });

        if (error) {
            console.error('❌ Ошибка загрузки всех пользователей:', error);
            return [];
        }

        const processedUsers = (users || []).map(user => ({
            ...user,
            displayName: user.first_name || user.username || `user${user.id.substring(0, 8)}`
        }));

        return processedUsers;
        
    } catch (error) {
        console.error('❌ Ошибка загрузки всех пользователей:', error);
        return [];
    }
}

// Загрузка чатов пользователя
async function loadUserChats() {
    try {
        const { data: memberships, error } = await supabase
            .from('chat_members')
            .select('chat_id')
            .eq('user_id', currentUser.id);

        if (error) {
            console.error('❌ Ошибка загрузки memberships:', error);
            return;
        }

        if (!memberships || memberships.length === 0) {
            userChats = [];
            renderChats();
            return;
        }

        const chatIds = memberships.map(m => m.chat_id);
        const { data: chats, error: chatsError } = await supabase
            .from('chats')
            .select('*')
            .in('id', chatIds)
            .order('last_message_at', { ascending: false });

        if (chatsError) {
            console.error('❌ Ошибка загрузки chats:', chatsError);
            return;
        }

        userChats = chats || [];
        renderChats();
        
    } catch (error) {
        console.error('❌ Ошибка загрузки чатов:', error);
        userChats = [];
        renderChats();
    }
}

// Отображение чатов
function renderChats() {
    const chatsList = document.getElementById('chatsList');
    
    if (userChats.length === 0) {
        chatsList.innerHTML = `
            <div class="chat-item">
                <div class="chat-info">
                    <div class="chat-avatar">💬</div>
                    <div class="chat-details">
                        <div class="chat-name">Нет чатов</div>
                        <div class="last-message">Найдите пользователя чтобы начать общение</div>
                    </div>
                </div>
            </div>
        `;
        return;
    }

    chatsList.innerHTML = userChats.map(chat => {
        const avatarText = chat.name ? chat.name[0].toUpperCase() : '?';
        const isActive = currentChat && currentChat.id === chat.id;
        const isPrivate = chat.name && chat.name.startsWith('Чат с ');
        
        return `
            <div class="chat-item ${isActive ? 'active' : ''}" onclick="selectChat('${chat.id}')">
                <div class="chat-info">
                    <div class="chat-avatar">${isPrivate ? '👤' : '👥'}</div>
                    <div class="chat-details">
                        <div class="chat-name">${chat.name || 'Чат'}</div>
                        <div class="last-message">${isPrivate ? 'Личный чат' : 'Групповой чат'}</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Показать список пользователей
function showUserList(users, emptyMessage) {
    let usersHTML = '';
    
    users.forEach(user => {
        usersHTML += `
            <div class="chat-item" onclick="startPrivateChat('${user.id}', '${user.displayName}')">
                <div class="chat-info">
                    <div class="chat-avatar">👤</div>
                    <div class="chat-details">
                        <div class="chat-name">${user.displayName}</div>
                        <div class="last-message">Написать сообщение</div>
                    </div>
                </div>
            </div>
        `;
    });

    document.getElementById('chatsList').innerHTML = usersHTML || `<div class="chat-item">${emptyMessage}</div>`;
}

// Начать личный чат с реальным пользователем
async function startPrivateChat(userId, username) {
    try {
        console.log('🔍 Поиск чата с пользователем:', username);
        
        const { data: existingChats, error } = await supabase
            .from('chat_members')
            .select('chat_id')
            .eq('user_id', currentUser.id);

        if (error) throw error;

        for (let member of existingChats) {
            const { data: chatMembers, error: membersError } = await supabase
                .from('chat_members')
                .select('user_id')
                .eq('chat_id', member.chat_id);

            if (!membersError && chatMembers) {
                const hasTargetUser = chatMembers.some(m => m.user_id === userId);
                if (hasTargetUser) {
                    console.log('✅ Найден существующий чат');
                    await loadUserChats();
                    selectChat(member.chat_id);
                    showToast(`Открыт чат с ${username}`, 'success');
                    return;
                }
            }
        }

        console.log('🆕 Создаем новый чат');
        const chatName = `Чат с ${username}`;
        const { data: chat, error: chatError } = await supabase
            .from('chats')
            .insert([{ 
                name: chatName, 
                created_by: currentUser.id 
            }])
            .select()
            .single();

        if (chatError) throw chatError;

        const { error: membersError } = await supabase
            .from('chat_members')
            .insert([
                { chat_id: chat.id, user_id: currentUser.id },
                { chat_id: chat.id, user_id: userId }
            ]);

        if (membersError) throw membersError;

        console.log('✅ Чат создан:', chat.id);
        showToast(`Чат с ${username} создан`, 'success');
        
        await loadUsersForSidebar();
        await loadUserChats();
        selectChat(chat.id);
        
    } catch (error) {
        console.error('❌ Ошибка создания чата:', error);
        showToast('Ошибка: ' + error.message, 'error');
    }
}

// Выбор чата
async function selectChat(chatId) {
    try {
        const { data: chat, error } = await supabase
            .from('chats')
            .select('*')
            .eq('id', chatId)
            .single();

        if (error) throw error;

        currentChat = chat;
        
        // Получаем информацию о другом пользователе (для личных чатов)
        let otherUserId = null;
        let otherUserName = null;
        
        if (chat.name && chat.name.startsWith('Чат с ')) {
            const { data: members, error: membersError } = await supabase
                .from('chat_members')
                .select('user_id')
                .eq('chat_id', chatId)
                .neq('user_id', currentUser.id);

            if (!membersError && members && members.length > 0) {
                otherUserId = members[0].user_id;
                // Получаем имя пользователя
                const { data: userProfile } = await supabase
                    .from('profiles')
                    .select('first_name, username')
                    .eq('id', otherUserId)
                    .single();
                    
                if (userProfile) {
                    otherUserName = userProfile.first_name || userProfile.username;
                }
            }
        }

        // Обновляем заголовок чата с кликабельными элементами
        const chatHeaderHTML = `
            <div class="chat-header-info">
                <div class="user-avatar clickable-avatar" id="currentChatAvatar" 
                     onclick="${otherUserId ? `showUserProfile('${otherUserId}')` : ''}" 
                     style="cursor: ${otherUserId ? 'pointer' : 'default'};">
                    ${chat.name ? chat.name[0].toUpperCase() : '?'}
                </div>
                <div>
                    <h3 class="clickable-username" 
                        onclick="${otherUserId ? `showUserProfile('${otherUserId}')` : ''}"
                        style="cursor: ${otherUserId ? 'pointer' : 'default'}; margin-bottom: 5px;">
                        ${chat.name || 'Чат'}
                    </h3>
                    <span class="status" id="chatStatus">online</span>
                </div>
            </div>
        `;
        
        document.querySelector('.chat-header').innerHTML = chatHeaderHTML + `
            <div>
                <button class="logout-btn" id="leaveChatBtn" onclick="leaveChat()" style="display: ${chat.name && chat.name.startsWith('Чат с ') ? 'none' : 'block'};">Покинуть чат</button>
            </div>
        `;

        // Сохраняем ID другого пользователя для использования в сообщениях
        if (otherUserId) {
            currentChat.otherUserId = otherUserId;
            currentChat.otherUserName = otherUserName;
        }
        
        await loadMessages(chatId);
        await loadChatMembers(chatId);
        renderChats();
        
    } catch (error) {
        console.error('❌ Ошибка выбора чата:', error);
    }
}

// Загрузка участников чата
// Загрузка участников чата
async function loadChatMembers(chatId) {
    try {
        const { data: members, error } = await supabase
            .from('chat_members')
            .select(`
                user_id,
                profiles:user_id (username, first_name)
            `)
            .eq('chat_id', chatId);

        if (error) {
            console.error('❌ Ошибка загрузки участников:', error);
            return;
        }

        if (members && members.length > 0) {
            const memberNames = members.map(m => {
                if (m.profiles) {
                    return m.profiles.first_name || m.profiles.username || `user${m.user_id.substring(0, 8)}`;
                }
                return `user${m.user_id.substring(0, 8)}`;
            }).join(', ');
            
            document.getElementById('chatStatus').textContent = `Участники: ${memberNames}`;
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки участников:', error);
    }
}
// Функция для РУЧНОГО включения уведомлений (только по кнопке!)
// Функция для РУЧНОГО включения уведомлений
async function enableNotificationsManually() {
    if (!('Notification' in window)) {
        showToast('❌ Браузер не поддерживает уведомления', 'error');
        return false;
    }

    console.log('🔔 Текущий статус уведомлений:', Notification.permission);

    if (Notification.permission === 'granted') {
        showToast('✅ Уведомления уже включены!', 'success');
        // Сразу показываем тестовое уведомление
        setTimeout(() => testSimpleNotification(), 500);
        return true;
    }

    if (Notification.permission === 'denied') {
        showToast('❌ Уведомления заблокированы в настройках браузера', 'warning');
        return false;
    }

    // Запрашиваем разрешение
    try {
        const permission = await Notification.requestPermission();
        console.log('🔔 Новый статус после запроса:', permission);
        
        if (permission === 'granted') {
            showToast('✅ Уведомления включены!', 'success');
            // Даем время на обновление статуса
            setTimeout(() => {
                testSimpleNotification();
            }, 1000);
            return true;
        } else {
            showToast('❌ Уведомления отключены', 'warning');
            return false;
        }
    } catch (error) {
        console.error('❌ Ошибка запроса уведомлений:', error);
        showToast('Ошибка настройки уведомлений', 'error');
        return false;
    }
}

// Упрощенный тест уведомлений
function testSimpleNotification() {
    console.log('🧪 Запуск теста уведомлений, статус:', Notification.permission);
    
    if (!('Notification' in window)) {
        showToast('❌ Браузер не поддерживает уведомления', 'error');
        return;
    }

    // Проверяем актуальный статус
    if (Notification.permission !== 'granted') {
        showToast('❌ Разрешение не получено. Статус: ' + Notification.permission, 'warning');
        return;
    }

    try {
        console.log('🔔 Создаем уведомление...');
        const notification = new Notification('AresGram - Тест', {
            body: '✅ Уведомления работают правильно!',
            icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23e74c3c" rx="20"/><text x="50" y="60" font-size="40" text-anchor="middle" fill="white">A</text></svg>',
            tag: 'test-notification'
        });
        
        notification.onclick = function() {
            console.log('🔔 Уведомление кликнуто');
            window.focus();
            this.close();
        };

        notification.onshow = function() {
            console.log('🔔 Уведомление показано');
            showToast('✅ Тестовое уведомление отправлено!', 'success');
        };

        // Автоматически закрываем через 5 секунд
        setTimeout(() => {
            if (notification.close) {
                notification.close();
                console.log('🔔 Уведомление закрыто');
            }
        }, 5000);
        
    } catch (error) {
        console.error('❌ Ошибка создания уведомления:', error);
        showToast('❌ Ошибка: ' + error.message, 'error');
    }
}

// Альтернативная функция - все в одном
function testNotificationsOneClick() {
    console.log('🔔 Запуск теста в один клик');
    
    if (!('Notification' in window)) {
        showToast('❌ Браузер не поддерживает уведомления', 'error');
        return;
    }

    const handlePermission = (permission) => {
        console.log('🔔 Обработка разрешения:', permission);
        
        if (permission === 'granted') {
            showToast('✅ Уведомления включены! Показываем тест...', 'success');
            
            // Ждем немного чтобы статус обновился
            setTimeout(() => {
                try {
                    const notification = new Notification('AresGram - Успех!', {
                        body: '✅ Уведомления работают отлично!',
                        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%2327ae60" rx="20"/><text x="50" y="60" font-size="40" text-anchor="middle" fill="white">✓</text></svg>'
                    });
                    
                    notification.onclick = () => {
                        window.focus();
                        notification.close();
                    };
                    
                    setTimeout(() => notification.close(), 5000);
                    
                } catch (error) {
                    console.error('❌ Ошибка тестового уведомления:', error);
                    showToast('❌ Ошибка показа уведомления', 'error');
                }
            }, 500);
            
        } else if (permission === 'default') {
            // Запрашиваем разрешение
            Notification.requestPermission().then(handlePermission);
        } else {
            showToast('❌ Уведомления заблокированы', 'warning');
        }
    };

    // Начинаем с текущего статуса
    handlePermission(Notification.permission);
}

// Загрузка сообщений
async function loadMessages(chatId) {
    try {
        console.log('📨 Загрузка сообщений для чата:', chatId);
        
        const { data: messages, error } = await supabase
            .from('messages')
            .select('*')
            .eq('chat_id', chatId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('❌ Ошибка загрузки сообщений:', error);
            throw error;
        }

        const messagesContainer = document.getElementById('messagesContainer');
        messagesContainer.innerHTML = '';

        if (messages && messages.length > 0) {
            console.log('✅ Загружено сообщений:', messages.length);
            
            // Получаем информацию об отправителях
            const senderIds = [...new Set(messages.map(m => m.sender_id))];
            const { data: senders, error: sendersError } = await supabase
                .from('profiles')
                .select('id, first_name, username, avatar_url')
                .in('id', senderIds);

            const sendersMap = {};
            if (!sendersError && senders) {
                senders.forEach(sender => {
                    sendersMap[sender.id] = sender;
                });
            }
            
            messages.forEach(message => {
                const isSent = message.sender_id === currentUser.id;
                const isSystem = message.is_system;
                const sender = sendersMap[message.sender_id];
                const senderName = sender ? (sender.first_name || sender.username) : 'Пользователь';
                
                const messageElement = document.createElement('div');
                
                if (isSystem) {
                    messageElement.className = 'message system';
                    messageElement.innerHTML = `
                        <div class="system-message">${message.text}</div>
                        <div class="message-time">
                            ${new Date(message.created_at).toLocaleTimeString()}
                        </div>
                    `;
                } else {
                    messageElement.className = `message ${isSent ? 'sent' : 'received'}`;
                    
                    if (!isSent && sender) {
                        // Для полученных сообщений добавляем кликабельную аватарку отправителя
                        messageElement.innerHTML = `
                            <div class="message-sender-info">
                                <div class="message-avatar clickable-avatar" 
                                     onclick="showUserProfile('${message.sender_id}')"
                                     style="cursor: pointer;">
                                    ${sender.avatar_url ? 
                                        `<img src="${sender.avatar_url}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">` :
                                        senderName[0].toUpperCase()
                                    }
                                </div>
                                <div class="message-content">
                                    <div class="message-sender-name clickable-username" 
                                         onclick="showUserProfile('${message.sender_id}')"
                                         style="cursor: pointer;">
                                        ${senderName}
                                    </div>
                                    <div class="message-text">${message.text}</div>
                                    <div class="message-time">
                                        ${new Date(message.created_at).toLocaleTimeString()}
                                    </div>
                                </div>
                            </div>
                        `;
                    } else {
                        // Для отправленных сообщений - обычный вид
                        messageElement.innerHTML = `
                            ${message.text}
                            <div class="message-time">
                                ${new Date(message.created_at).toLocaleTimeString()}
                            </div>
                        `;
                    }
                }
                
                messagesContainer.appendChild(messageElement);
            });
        } else {
            console.log('📭 Нет сообщений в чате');
            messagesContainer.innerHTML = '<div class="message received">Нет сообщений. Начните общение!</div>';
        }

        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
    } catch (error) {
        console.error('❌ Ошибка загрузки сообщений:', error);
        document.getElementById('messagesContainer').innerHTML = '<div class="message received">Ошибка загрузки сообщений</div>';
    }
}

// Отправка сообщения
// Отправка сообщения (упрощенная версия)
async function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const messageText = messageInput.value.trim();

    if (!messageText || !currentChat) {
        showToast('Введите сообщение!', 'warning');
        return;
    }

    try {
        console.log('📤 Отправка сообщения:', messageText);
        
        const { data, error } = await supabase
            .from('messages')
            .insert([{
                chat_id: currentChat.id,
                sender_id: currentUser.id,
                text: messageText
            }])
            .select();

        if (error) throw error;

        console.log('✅ Сообщение отправлено, ID:', data[0].id);
        messageInput.value = '';
        
        // ТОЛЬКО обновление времени сообщения
        await supabase
            .from('chats')
            .update({ last_message_at: new Date() })
            .eq('id', currentChat.id);

        // УБЕРИТЕ отправку push-уведомлений отсюда
        // await sendPushNotificationToChatMembers(currentChat.id, messageText);
        
        await loadMessages(currentChat.id);
        await loadUserChats();
            
    } catch (error) {
        console.error('❌ Ошибка отправки:', error);
        showToast('Ошибка отправки: ' + error.message, 'error');
    }
}

// Real-time подписка
function setupRealtimeSubscription() {
    try {
        // Удалим старые подписки канала, если они есть
        if (window._aresgram_message_channel && window._aresgram_message_channel.unsubscribe) {
            try { window._aresgram_message_channel.unsubscribe(); } catch (e) { /* ignore */ }
            window._aresgram_message_channel = null;
        }

        // Создаём канал в Supabase Realtime (v2 API)
        const channel = supabase.channel('public:messages');

        channel.on('postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'messages' },
            payload => {
                console.log('Realtime INSERT payload:', payload);
                const record = payload.new || payload.record || payload;

                // Быстрая проверка структуры
                if (!record) return;

                // Игнорируем свои сообщения
                if (record.sender_id === currentUser?.id) return;

                // Показываем уведомление
                handleIncomingMessageNotification(record);

                // Если текущий выбранный чат — тот же, добавим сообщение в UI через существующую функцию loadMessages/append
                // При необходимости можно вызывать loadMessages(currentChat.id) или appendMessage(record)
                // Пример: если открыт нужный чат - просто обновляем список сообщений
                if (currentChat && currentChat.id === record.chat_id) {
                    // Попробуем вызвать функцию, которая добавляет сообщение в UI
                    if (typeof appendMessage === 'function') {
                        try { appendMessage(record); } catch (e) { console.error(e); }
                    } else {
                        // fallback: перезагрузим сообщения для чата
                        try { loadMessages(currentChat.id); } catch (e) { console.error(e); }
                    }
                } else {
                    // Если чат не открыт — можно пометить чат как непрочитанный (если у тебя есть такая логика)
                    // showToast(`Новое сообщение в чате`, 'info');
                }
            }
        );

        // Подписываемся
        channel.subscribe(status => {
            console.log('Supabase channel status:', status);
        });

        // Сохраним для возможной отписки в будущем
        window._aresgram_message_channel = channel;

    } catch (err) {
        console.error('Ошибка setupRealtimeSubscription:', err);
    }
}

// Принудительно проверить новые сообщения
async function checkForNewMessages() {
    if (currentChat) {
        console.log('🔍 Проверка новых сообщений для чата:', currentChat.name);
        await loadMessages(currentChat.id);
    }
    await loadUserChats();
}

// Принудительно обновить список пользователей
async function refreshUsers() {
    console.log('🔄 Обновление пользователей для сайдбара...');
    await loadUsersForSidebar();
    
    if (allUsers.length === 0) {
        showToast('Нет пользователей с которыми начато общение!', 'info');
    } else {
        showToast(`Найдено ${allUsers.length} пользователей с чатами`, 'success');
        searchUsers();
    }
}

// Создание группового чата
async function createGroupChat() {
    const chatName = document.getElementById('newChatName').value.trim();
    
    if (!chatName) {
        showToast('Введите название чата!', 'warning');
        return;
    }

    try {
        const { data: chat, error } = await supabase
            .from('chats')
            .insert([{ name: chatName, created_by: currentUser.id }])
            .select()
            .single();

        if (error) throw error;

        const { error: memberError } = await supabase
            .from('chat_members')
            .insert([{ chat_id: chat.id, user_id: currentUser.id }]);

        if (memberError) throw memberError;

        hideCreateChatModal();
        document.getElementById('newChatName').value = '';
        
        showToast(`Чат "${chatName}" создан`, 'success');
        await loadUserChats();
        selectChat(chat.id);
        showAddMembersModal(chat.id, chatName);
        
    } catch (error) {
        console.error('❌ Ошибка создания:', error);
        showToast('Ошибка: ' + error.message, 'error');
    }
}

// Показать модальное окно добавления участников
function showAddMembersModal(chatId, chatName) {
    const modalHTML = `
        <div class="modal" id="addMembersModal" style="display: flex;">
            <div class="modal-content">
                <h2>Добавить участников в "${chatName}"</h2>
                <p style="color: #666; margin-bottom: 15px;">Можно добавить до 100 участников</p>
                <input type="text" class="modal-input" id="memberSearchInput" placeholder="Поиск пользователей..." onkeyup="searchMembers('${chatId}')">
                <div id="membersList" style="max-height: 400px; overflow-y: auto; margin: 15px 0;"></div>
                <div class="modal-buttons">
                    <button class="modal-btn secondary" onclick="closeAddMembersModal()">Готово</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    showAllMembersForAdd(chatId);
}

// Показать всех пользователей для добавления
async function showAllMembersForAdd(chatId) {
    const membersList = document.getElementById('membersList');
    if (!membersList) return;

    const allUsersForModal = await loadAllUsersForModal();

    if (allUsersForModal.length === 0) {
        membersList.innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">Нет других пользователей</div>';
        return;
    }

    let membersHTML = '<div style="padding: 10px; font-weight: bold; border-bottom: 1px solid #ddd;">Все пользователи</div>';
    
    allUsersForModal.forEach(user => {
        membersHTML += `
            <div class="user-list-item">
                <div class="user-info-modal">
                    <div class="user-avatar-small">${user.displayName[0].toUpperCase()}</div>
                    <div class="user-details">
                        <div class="user-name">${user.displayName}</div>
                    </div>
                </div>
                <button class="modal-btn primary" onclick="addUserToChat('${chatId}', '${user.id}', '${user.displayName}')" style="padding: 8px 15px;">
                    Добавить
                </button>
            </div>
        `;
    });

    membersList.innerHTML = membersHTML;
}

// Поиск пользователей для добавления
async function searchMembers(chatId) {
    const searchTerm = document.getElementById('memberSearchInput').value.trim().toLowerCase();
    const membersList = document.getElementById('membersList');
    
    if (!membersList) return;
    
    if (searchTerm.length === 0) {
        showAllMembersForAdd(chatId);
        return;
    }

    const allUsersForModal = await loadAllUsersForModal();
    
    const filteredUsers = allUsersForModal.filter(user => 
        user.displayName && user.displayName.toLowerCase().includes(searchTerm)
    );

    if (filteredUsers.length === 0) {
        membersList.innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">Пользователи не найдены</div>';
        return;
    }

    let membersHTML = '<div style="padding: 10px; font-weight: bold; border-bottom: 1px solid #ddd;">Результаты поиска</div>';
    
    filteredUsers.forEach(user => {
        membersHTML += `
            <div class="user-list-item">
                <div class="user-info-modal">
                    <div class="user-avatar-small">${user.displayName[0].toUpperCase()}</div>
                    <div class="user-details">
                        <div class="user-name">${user.displayName}</div>
                    </div>
                </div>
                <button class="modal-btn primary" onclick="addUserToChat('${chatId}', '${user.id}', '${user.displayName}')" style="padding: 8px 15px;">
                    Добавить
                </button>
            </div>
        `;
    });

    membersList.innerHTML = membersHTML;
}

// Добавить пользователя в чат
async function addUserToChat(chatId, userId, username) {
    try {
        const { data: existing, error: checkError } = await supabase
            .from('chat_members')
            .select('id')
            .eq('chat_id', chatId)
            .eq('user_id', userId)
            .single();

        if (existing) {
            showToast(`${username} уже в чате!`, 'warning');
            return;
        }

        const { data: members, error: countError } = await supabase
            .from('chat_members')
            .select('id')
            .eq('chat_id', chatId);

        if (!countError && members && members.length >= 100) {
            showToast('Достигнут лимит в 100 участников!', 'warning');
            return;
        }

        const { error } = await supabase
            .from('chat_members')
            .insert([{ chat_id: chatId, user_id: userId }]);

        if (error) throw error;

        await sendSystemMessage(chatId, `@${username} добавлен в чат`);

        showToast(`✅ ${username} добавлен в чат!`, 'success');
        await loadChatMembers(chatId);
        
    } catch (error) {
        console.error('❌ Ошибка добавления:', error);
        showToast('Ошибка: ' + error.message, 'error');
    }
}

// Закрыть модальное окно добавления участников
function closeAddMembersModal() {
    const modal = document.getElementById('addMembersModal');
    if (modal) modal.remove();
}

// Выход из системы
async function logout() {
    await supabase.auth.signOut();
    window.location.href = 'login.html';
}

// Функции модальных окон
function showCreateChatModal() {
    document.getElementById('createChatModal').style.display = 'flex';
}

function hideCreateChatModal() {
    document.getElementById('createChatModal').style.display = 'none';
}

// Функции для системных уведомлений
function getChatIcon() {
    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#e74c3c"/><circle cx="32" cy="32" r="12" fill="white"/><circle cx="25" cy="28" r="2" fill="#e74c3c"/><circle cx="39" cy="28" r="2" fill="#e74c3c"/><path d="M25 38 Q32 42 39 38" stroke="#e74c3c" stroke-width="2" fill="none"/></svg>`;
    return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));
}

function getMessageIcon() {
    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#3498db"/><rect x="12" y="18" width="40" height="28" rx="4" fill="white" stroke="#3498db" stroke-width="2"/><circle cx="22" cy="26" r="1.5" fill="#3498db"/><circle cx="32" cy="26" r="1.5" fill="#3498db"/><circle cx="42" cy="26" r="1.5" fill="#3498db"/><rect x="16" y="32" width="32" height="2" rx="1" fill="#3498db"/><rect x="16" y="36" width="24" height="2" rx="1" fill="#3498db"/></svg>`;
    return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));
}

function getGroupIcon() {
    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#9b59b6"/><circle cx="20" cy="26" r="6" fill="white"/><circle cx="44" cy="26" r="6" fill="white"/><circle cx="32" cy="38" r="8" fill="white"/><circle cx="16" cy="22" r="2" fill="#9b59b6"/><circle cx="48" cy="22" r="2" fill="#9b59b6"/><circle cx="28" cy="36" r="1.5" fill="#9b59b6"/><circle cx="36" cy="36" r="1.5" fill="#9b59b6"/><path d="M28 42 Q32 45 36 42" stroke="#9b59b6" stroke-width="1.5" fill="none"/></svg>`;
    return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));
}

function getAlertIcon() {
    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#e67e22"/><path d="M32 16 L32 36 M32 42 L32 46" stroke="white" stroke-width="3" stroke-linecap="round"/><circle cx="32" cy="32" r="2" fill="white"/></svg>`;
    return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));
}

function getSuccessIcon() {
    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#27ae60"/><path d="M20 32 L28 40 L44 24" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`;
    return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));
}

function getDefaultIcon() {
    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#e74c3c"/><text x="32" y="40" font-family="Arial" font-size="24" text-anchor="middle" fill="white">A</text></svg>`;
    return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));
}

// Функция для показа системных уведомлений Windows
function showWindowsNotification(title, message, options = {}) {
    if (!('Notification' in window)) {
        console.log('❌ Браузер не поддерживает уведомления');
        return null;
    }

    if (Notification.permission !== 'granted') {
        console.log('❌ Уведомления не разрешены. Текущий статус:', Notification.permission);
        return null;
    }

    const notificationOptions = {
        icon: options.icon || getDefaultIcon(),
        badge: options.badge || getDefaultIcon(),
        body: message,
        tag: options.tag || 'aresgram-notification',
        requireInteraction: options.requireInteraction || false,
        silent: options.silent || false,
        ...options
    };

    try {
        console.log('🔔 Показываем системное уведомление:', { title, message });
        
        const notification = new Notification(title, notificationOptions);
        
        // Базовый обработчик клика
        notification.onclick = function(event) {
            console.log('🔔 Уведомление кликнуто');
            window.focus();
            this.close();
            
            // Вызываем кастомный обработчик если есть
            if (typeof options.onClick === 'function') {
                options.onClick(event);
            }
        };

        notification.onerror = function(error) {
            console.error('❌ Ошибка уведомления:', error);
        };

        notification.onshow = function() {
            console.log('🔔 Уведомление показано');
        };

        notification.onclose = function() {
            console.log('🔔 Уведомление закрыто');
        };

        // Автоматическое закрытие
        if (options.duration) {
            setTimeout(() => {
                if (notification.close) {
                    notification.close();
                }
            }, options.duration);
        }

        return notification;
    } catch (error) {
        console.error('❌ Критическая ошибка создания уведомления:', error);
        return null;
    }
}

// Функция отправки тестового системного уведомления Windows
async function sendWindowsNotificationTest() {
    console.log('🧪 Начинаем тест системных уведомлений...');
    
    // Проверяем поддержку
    if (!('Notification' in window)) {
        showToast('❌ Ваш браузер не поддерживает уведомления', 'error');
        return;
    }

    // Проверяем разрешение
    if (Notification.permission !== 'granted') {
        console.log('🔔 Запрашиваем разрешение...');
        const permission = await Notification.requestPermission();
        
        if (permission !== 'granted') {
            showToast('❌ Разрешение на уведомления не получено', 'warning');
            return;
        }
    }

    const testMessage = "✅ Тестовое уведомление Windows работает!";
    const chatName = currentChat ? currentChat.name : "Тестовый чат";
    
    console.log('🔔 Показываем уведомление...');
    
    const notification = showWindowsNotification(
        `💬 ${chatName}`,
        testMessage,
        {
            icon: getChatIcon(),
            requireInteraction: true,
            duration: 10000,
            onClick: () => {
                console.log('🔔 Обработчик клика сработал');
                if (currentChat) {
                    selectChat(currentChat.id);
                }
            }
        }
    );

    if (notification) {
        console.log('✅ Уведомление успешно создано');
        showToast('✅ Системное уведомление отправлено!', 'success');
        
        // Добавляем обработчик для демонстрации
        notification.addEventListener('click', () => {
            console.log('🔔 addEventListener: Уведомление кликнуто');
            window.focus();
        });
    } else {
        console.log('❌ Не удалось создать уведомление');
        showToast('❌ Ошибка отправки уведомления', 'error');
    }
}

// Простой тест уведомлений
// Простой тест уведомлений (без запроса разрешений)
function testSimpleNotification() {
    if (!('Notification' in window)) {
        showToast('❌ Браузер не поддерживает уведомления', 'error');
        return;
    }

    if (Notification.permission !== 'granted') {
        showToast('❌ Сначала включите уведомления', 'warning');
        return;
    }

    try {
        const notification = new Notification('AresGram Test', {
            body: '✅ Тестовое уведомление работает!',
            icon: '/favicon.ico',
            tag: 'test'
        });
        
        notification.onclick = function() {
            console.log('✅ Уведомление сработало!');
            window.focus();
            this.close();
        };
        
        setTimeout(() => {
            if (notification.close) notification.close();
        }, 5000);
        
    } catch (error) {
        console.error('❌ Ошибка уведомления:', error);
        showToast('Ошибка: ' + error.message, 'error');
    }
}

// Функция для тестирования разных типов уведомлений
function testWindowsNotifications() {
    const notificationTypes = [
        {
            title: "📨 Новое сообщение",
            message: "Привет! Как твои дела?",
            options: {
                icon: getMessageIcon(),
                requireInteraction: false
            }
        },
        {
            title: "👥 Групповой чат",
            message: "Мария: Ребята, посмотрите на это!",
            options: {
                icon: getGroupIcon(),
                requireInteraction: true
            }
        },
        {
            title: "🔔 Напоминание",
            message: "У вас непрочитанные сообщения",
            options: {
                icon: getAlertIcon(),
                requireInteraction: true,
                actions: [
                    {
                        action: 'view',
                        title: '👀 Посмотреть'
                    }
                ]
            }
        },
        {
            title: "✅ Успех",
            message: "Сообщение доставлено",
            options: {
                icon: getSuccessIcon(),
                requireInteraction: false
            }
        }
    ];

    let delay = 0;
    notificationTypes.forEach((type, index) => {
        setTimeout(() => {
            const notification = showWindowsNotification(
                type.title,
                type.message,
                {
                    ...type.options,
                    onClick: () => {
                        console.log(`🔔 Уведомление ${index + 1} кликнуто`);
                        if (currentChat) {
                            selectChat(currentChat.id);
                        }
                    }
                }
            );
            
            if (notification) {
                console.log(`✅ Уведомление ${index + 1} отправлено`);
            }
        }, delay);
        
        delay += 3000; // 3 секунды между уведомлениями
    });

    showToast(`Запущено тестирование ${notificationTypes.length} уведомлений`, 'info');
}

// Функция для проверки и настройки уведомлений
function setupWindowsNotifications() {
    if (!('Notification' in window)) {
        showToast('Ваш браузер не поддерживает уведомления', 'warning');
        return;
    }

    const modalHTML = `
        <div class="modal-overlay" id="notificationsSetupModal" style="display: flex;">
            <div class="modal-content">
                <h2>🔔 Настройка уведомлений Windows</h2>
                
                <div style="margin: 20px 0;">
                    <p><strong>Текущий статус:</strong> ${Notification.permission}</p>
                    <p style="font-size: 14px; color: #666; margin-top: 10px;">
                        Разрешите уведомления чтобы получать сообщения даже когда приложение закрыто.
                    </p>
                </div>
                
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <h4>Что вы получите:</h4>
                    <ul style="margin: 10px 0; padding-left: 20px;">
                        <li>Уведомления о новых сообщениях</li>
                        <li>Возможность быстрого перехода в чат</li>
                        <li>Работу даже когда сайт закрыт</li>
                        <li>Системные уведомления Windows</li>
                    </ul>
                </div>
                
                <div class="modal-buttons">
                    <button class="modal-btn secondary" onclick="closeModalWithAnimation('notificationsSetupModal')">
                        Позже
                    </button>
                    <button class="modal-btn primary" onclick="requestNotificationPermission()">
                        🔔 Включить уведомления
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Функция запроса разрешения
async function requestNotificationPermission() {
    try {
        if (!('Notification' in window)) {
            showToast('Браузер не поддерживает Web Notifications', 'error');
            return false;
        }

        // Если уже разрешено — обновим интерфейс
        if (Notification.permission === 'granted') {
            showToast('Уведомления уже включены', 'success');
            document.getElementById('enableNotificationsBtn').style.display = 'none';
            return true;
        }

        // Просим разрешение
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            showToast('✅ Уведомления включены!', 'success');
            document.getElementById('enableNotificationsBtn').style.display = 'none';
            return true;
        } else if (permission === 'denied') {
            showToast('Уведомления заблокированы. Разрешите в настройках браузера.', 'warning');
            return false;
        } else {
            showToast('Разрешение не получено', 'warning');
            return false;
        }
    } catch (err) {
        console.error('Ошибка запроса уведомлений:', err);
        showToast('Ошибка запроса уведомлений', 'error');
        return false;
    }
}
function handleIncomingMessageNotification(record) {
    try {
        // record ожидается в формате: { id, chat_id, sender_id, text, ... }
        const title = record.sender_name || 'Новое сообщение';
        const body = (record.text && record.text.length > 120) ? record.text.slice(0, 120) + '…' : (record.text || 'Новое сообщение');
        const chatId = record.chat_id;

        // Если нет permissions — не создаём
        if (!('Notification' in window) || Notification.permission !== 'granted') {
            console.log('Notifications unavailable or not granted');
            return;
        }

        const options = {
            body: body,
            icon: '/icon-192x192.png', // можешь поменять на реальный путь к иконке
            data: {
                chatId: chatId,
                messageId: record.id
            },
            tag: `message-${chatId}` // сгруппировать уведомления по чату
        };

        const notif = new Notification(title, options);

        notif.onclick = function (ev) {
            ev.preventDefault();
            // Фокусируем окно/вкладку
            try { window.focus(); } catch (e) {}
            // Пытаемся перейти в чат — если функция selectChat доступна, вызываем её
            if (typeof selectChat === 'function') {
                // Немного задержим чтобы окно успело сфокусироваться
                setTimeout(() => {
                    try { selectChat(chatId); } catch (err) { console.error(err); }
                }, 200);
            } else {
                // Альтернативный вариант — изменим URL, если у тебя есть роутинг по параметру chat
                if (window.location) {
                    const url = new URL(window.location.href);
                    url.searchParams.set('chat', chatId);
                    window.location.href = url.toString();
                }
            }
            notif.close();
        };

        // Авто-скрытие через 8 секунд
        setTimeout(() => {
            try { notif.close(); } catch (e) {}
        }, 8000);

    } catch (err) {
        console.error('Ошибка создания уведомления:', err);
    }
}


// Функция симуляции входящего сообщения
function simulateIncomingMessage() {
    if (!currentChat) {
        showToast('Сначала выберите чат!', 'warning');
        return;
    }

    const testUsers = [
        { name: "Анна Петрова", message: "Привет! Как твои дела?" },
        { name: "Иван Сидоров", message: "Посмотри на это новое сообщение!" },
        { name: "Мария Иванова", message: "Ты видел последние обновления?" },
        { name: "Алексей Козлов", message: "Можем обсудить этот вопрос?" }
    ];

    const randomUser = testUsers[Math.floor(Math.random() * testUsers.length)];
    
    // Показываем системное уведомление
    const notification = showWindowsNotification(
        `💬 ${randomUser.name}`,
        randomUser.message,
        {
            icon: getMessageIcon(),
            requireInteraction: true,
            actions: [
                {
                    action: 'open-chat',
                    title: '📂 Открыть чат'
                },
                {
                    action: 'mark-read',
                    title: '✅ Прочитано'
                }
            ],
            onClick: () => {
                console.log('🔔 Входящее сообщение - открываем чат');
                selectChat(currentChat.id);
            }
        }
    );

    // Добавляем обработчики действий
    if (notification) {
        notification.addEventListener('notificationclick', (event) => {
            event.preventDefault();
            
            switch (event.action) {
                case 'open-chat':
                    console.log('🔔 Действие: Открыть чат');
                    window.focus();
                    selectChat(currentChat.id);
                    break;
                    
                case 'mark-read':
                    console.log('🔔 Действие: Отметить прочитанным');
                    showToast('Сообщение отмечено как прочитанное', 'info');
                    break;
                    
                default:
                    console.log('🔔 Действие: Клик по уведомлению');
                    window.focus();
                    selectChat(currentChat.id);
            }
            
            notification.close();
        });

        showToast(`Симуляция сообщения от ${randomUser.name}`, 'success');
    }
}

// Функция для проверки поддержки уведомлений
function checkNotificationSupport() {
    const support = {
        'Notification API': 'Notification' in window,
        'Permission': Notification.permission,
        'Service Worker': 'serviceWorker' in navigator,
        'Push Manager': 'PushManager' in window,
        'Browser': detectBrowser()
    };
    
    let message = '🔍 Проверка поддержки:\n';
    Object.entries(support).forEach(([key, value]) => {
        message += `${key}: ${value}\n`;
    });
    
    alert(message);
}

// Функция определения браузера
function detectBrowser() {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Другой';
}

// Добавьте панель управления тестированием в сайдбар
function addTestControlsToSidebar() {
    const chatsControls = document.querySelector('.chats-controls');
    
    const testControlHTML = `
        <button class="control-button" onclick="showTestControlPanel()" style="background: #9b59b6;">
            🧪 Тест уведомлений
        </button>
    `;
    
    chatsControls.insertAdjacentHTML('beforeend', testControlHTML);
}

// Панель управления тестированием
function showTestControlPanel() {
    const modalHTML = `
        <div class="modal-overlay" id="testControlModal" style="display: flex;">
            <div class="modal-content">
                <h2>🧪 Тестирование уведомлений</h2>
                
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <h4>Текущий статус: <strong style="color: ${
                        Notification.permission === 'granted' ? '#27ae60' : 
                        Notification.permission === 'denied' ? '#e74c3c' : '#f39c12'
                    }">${Notification.permission}</strong></h4>
                    
                    ${Notification.permission === 'granted' ? `
                    <div style="color: #27ae60; font-weight: bold;">
                        ✅ Уведомления включены! Можно тестировать.
                    </div>
                    ` : Notification.permission === 'denied' ? `
                    <div style="color: #e74c3c;">
                        ❌ Уведомления заблокированы. Разрешите в настройках браузера.
                    </div>
                    ` : `
                    <div style="color: #f39c12;">
                        ⚠️ Уведомления не запрошены. Нажмите "Включить уведомления".
                    </div>
                    `}
                </div>
                
                <div style="display: grid; gap: 10px; margin: 20px 0;">
                    ${Notification.permission !== 'granted' ? `
                    <button class="modal-btn primary" onclick="testNotificationsOneClick()">
                        🔔 Включить уведомления
                    </button>
                    ` : ''}
                    
                    <button class="modal-btn" style="background: #27ae60;" onclick="testSimpleNotification()" 
                            ${Notification.permission !== 'granted' ? 'disabled' : ''}>
                        🧪 Тестировать уведомления
                    </button>
                </div>
                
                ${Notification.permission !== 'granted' ? `
                <div style="background: #e8f4fd; padding: 10px; border-radius: 5px; margin: 10px 0; border: 1px solid #3498db;">
                    <small>💡 <strong>После включения уведомлений страница перезагрузится автоматически</strong></small>
                </div>
                ` : ''}
                
                <div class="modal-buttons">
                    <button class="modal-btn secondary" onclick="closeModalWithAnimation('testControlModal')">
                        Закрыть
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}
// Функция проверки параметров URL
function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const chatId = urlParams.get('chat');
    
    if (chatId) {
        // Автоматически открываем указанный чат
        setTimeout(() => {
            selectChat(chatId);
            // Очищаем параметр из URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }, 1000);
    }
}

// Обработчики событий
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('messageInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    document.getElementById('searchInput').addEventListener('input', searchUsers);

    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });

    initApp();
});