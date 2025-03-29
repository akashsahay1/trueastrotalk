extension StringExtension on String {
  String toTitleCase() {
    if (this.isEmpty) return this;
    return this.split(' ').map((word) {
      if (word.isEmpty) return word;
      return word[0].toUpperCase() + word.substring(1).toLowerCase();
    }).join(' ');
  }
}
