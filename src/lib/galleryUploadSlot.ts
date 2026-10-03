/** Stand-in an <ImageGalleryField> submits in its kept-URL list wherever a
 * newly picked file sits, followed by that file's index in the input — so a
 * drag-reordered gallery can interleave new uploads with saved photos. The
 * server action swaps each one for the uploaded URL (resolveGalleryImageUrls). */
export const NEW_IMAGE_SLOT = "new-image:";
