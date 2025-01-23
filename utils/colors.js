
// generate a random color
function generateColor(username) {
    let hash = 0;

    for (let i = 0; i < username.length; i++) {
        hash = username.charCodeAt(i) + ((hash << 5) - hash); // el << desplaza los bits 5 posiciones a la izq y llenando los espacios vacios con ceros a la der // (x << 5) = x*2^5
    }

    // Asegurar valores positivos y tomar solo los bits relevantes
    const r = (hash & 0xFF0000) >> 16;
    const g = (hash & 0x00FF00) >> 8;
    const b = (hash & 0x0000FF);

    // Convertir a hexadecimal asegurando dos dígitos por color
    const color = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;

    return color;
}

function isColorLight(hexColor) {
    // Eliminar el '#' si existe
    hexColor = hexColor.replace('#', '');
  
    // Convertir el color de hexadecimal a RGB
    let r = parseInt(hexColor.substring(0, 2), 16);
    let g = parseInt(hexColor.substring(2, 4), 16);
    let b = parseInt(hexColor.substring(4, 6), 16);
  
    // Calcular luminancia percibida (usando la fórmula de brillo relativa)
    let brightness = (0.299 * r + 0.587 * g + 0.114 * b);
  
    // Si el brillo es alto, consideramos el color como claro
    return brightness > 150;  // Umbral típico para determinar claridad
}

module.exports = {
    generateColor,
    isColorLight
}
