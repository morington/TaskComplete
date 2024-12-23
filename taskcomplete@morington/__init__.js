const Gettext = imports.gettext;

const uuid = "taskcomplete@morington";

function _(str){
    let translated = Gettext.dgettext(uuid, str);
    return translated;
}
