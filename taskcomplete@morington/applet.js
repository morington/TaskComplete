const Applet = imports.ui.applet;
const PopupMenu = imports.ui.popupMenu;
const Lang = imports.lang;
const ModalDialog = imports.ui.modalDialog;
const St = imports.gi.St;

let _ = require('./__init__')._;

function TaskInputDialog(callback) {
    this._init(callback);
}

TaskInputDialog.prototype = {
    __proto__: ModalDialog.ModalDialog.prototype,

    _init: function(callback) {
        ModalDialog.ModalDialog.prototype._init.call(this, { styleClass: 'task-input-dialog' });

        this._callback = callback;

        // Поле ввода задачи
        this.entry = new St.Entry({
            name: 'TaskInputEntry'
        });

        // Добавляем текстовое поле в окно
        this.contentLayout.add(new St.Label({ text: _("Enter the name of the task:") }));
        this.contentLayout.add(this.entry);

        // Кнопки ОК и Отмена
        this.setButtons([
            {
                label: _("ОК"),
                action: Lang.bind(this, this._onOK)
            },
            {
                label: _("Cancel"),
                action: () => this.close(global.get_current_time())
            }
        ]);
    },

    // Обработка нажатия ОК
    _onOK: function() {
        this.close(global.get_current_time());
        if (this._callback) {
            this._callback(this.entry.get_text().trim());
        }
        this.entry.set_text(""); // Очистить поле ввода
    },

    // Переопределяем метод `open` для корректной работы
    open: function(timestamp) {
        ModalDialog.ModalDialog.prototype.open.call(this, timestamp);
        global.stage.set_key_focus(this.entry);
    }
};

class MyApplet extends Applet.IconApplet {
    constructor(metadata, orientation, panel_height, instance_id) {
        super(orientation, panel_height, instance_id);

        // Установим иконку и подсказку
        let iconPath = `${metadata.path}/taskcomplete-symbolic.svg`;
        this.set_applet_icon_path(iconPath);
        this.set_applet_tooltip(_("TaskComplete - task management"));

        this.menuManager = new PopupMenu.PopupMenuManager(this);
        this.menu = new Applet.AppletPopupMenu(this, orientation);
        this.menuManager.addMenu(this.menu);

        // Создадим список групп задач
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        // Кнопка для создания группы задач
        let createTaskGroupButton = new PopupMenu.PopupMenuItem(_("Create a task group"));
        createTaskGroupButton.connect('activate', () => {
            // Открываем диалоговое окно для ввода имени группы
            this.taskDialog.open(global.get_current_time());
        });
        this.menu.addMenuItem(createTaskGroupButton);
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        // Инициализируем диалог для ввода задач/групп
        this.taskDialog = new TaskInputDialog(Lang.bind(this, (inputText) => {
            if (inputText) {
                this.addTaskGroup(inputText); // Создаём новую группу задач
            }
        }));
    }

    addTaskGroup(groupName) {
        // Создаём подменю для группы задач
        let taskGroup = new PopupMenu.PopupSubMenuMenuItem(groupName);
    
        // Кнопка для создания новой задачи
        let createTaskButton = new PopupMenu.PopupMenuItem(_("Create a task"));
        createTaskButton.connect('activate', () => {
            let taskDialog = new TaskInputDialog((taskName) => {
                if (taskName) {
                    this.addTask(taskGroup, taskName);
                }
            });
            taskDialog.open(global.get_current_time());
        });
        taskGroup.menu.addMenuItem(createTaskButton);
    
        // Кнопка для удаления группы задач
        let deleteGroupButton = new PopupMenu.PopupMenuItem(_("Delete a task group"));
        deleteGroupButton.connect('activate', () => {
            // Показать диалог подтверждения
            this.showConfirmationDialog(_(`Are you sure you want to delete the group "${groupName}"?`), () => {
                taskGroup.destroy(); // Удалить группу из меню
            });
        });
    
        taskGroup.menu.addMenuItem(deleteGroupButton);
        taskGroup.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
    
        // Добавляем группу в главное меню
        this.menu.addMenuItem(taskGroup);
    }
    

    showConfirmationDialog(message, onConfirm) {
        let dialog = new ModalDialog.ModalDialog();
    
        // Установить сообщение подтверждения
        dialog.contentLayout.add(new St.Label({ text: message }));
    
        // Добавить кнопки
        dialog.setButtons([
            {
                label: _("Yes"),
                action: () => {
                    onConfirm(); // Выполнить действие при подтверждении
                    dialog.close(global.get_current_time());
                }
            },
            {
                label: _("Cancel"),
                action: () => dialog.close(global.get_current_time())
            }
        ]);
    
        // Открыть диалог
        dialog.open(global.get_current_time());
    }

    addTask(taskGroup, taskName) {
        // Создаём задачу с флажком
        let taskItem = new PopupMenu.PopupBaseMenuItem({ reactive: false });

        const iconComplete = new St.Icon({
            icon_name: 'process-stop',
            icon_type: St.IconType.SYMBOLIC,
            style_class: 'popup-menu-icon'
        });
        let buttonComplete = new St.Button({ child: iconComplete });
        taskItem.addActor(buttonComplete, { expand: false, span: 0, align: St.Align.START });

        let labelItem = new St.Label({ text: taskName, reactive: false });
        taskItem.addActor(labelItem, { expand: true, align: St.Align.START });

        // Флаг для зачёркивания
        let isToggled = false;

        buttonComplete.connect('clicked', () => {
            isToggled = !isToggled;
            if (isToggled) {
                labelItem.add_style_class_name('strikethrough');
            } else {
                labelItem.remove_style_class_name('strikethrough');
            }
        });

        const iconDelete = new St.Icon({
            icon_name: 'edit-delete',
            icon_type: St.IconType.SYMBOLIC,
            style_class: 'popup-menu-icon'
        });
        let deleteButton = new St.Button({ child: iconDelete });

        // Удаление задачи
        deleteButton.connect('clicked', () => {
            taskItem.destroy();
        });

        taskItem.addActor(deleteButton, { expand: false, span: 0, align: St.Align.END });

        // Добавляем задачу в подменю
        taskGroup.menu.addMenuItem(taskItem);
    }

    on_applet_clicked() {
        this.menu.toggle();
    }
}


function main(metadata, orientation, panel_height, instance_id) {
    return new MyApplet(metadata, orientation, panel_height, instance_id);
}
