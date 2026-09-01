// Si la imagen no carga (todavía no subiste la foto), la
// reemplazamos por un aviso en vez de mostrar el ícono roto.
function manejarErrorFoto(img) {
  const aviso = document.createElement('div');
  aviso.className = 'foto-placeholder';
  aviso.textContent = `Agregá la foto en assets/images/${img.dataset.nombre}`;
  img.replaceWith(aviso);
}