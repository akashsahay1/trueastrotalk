class Appnotification {
  final int id;
  final String title;
  final String description;
  final String date;
  final String type;
  final int read;

  Appnotification({
    required this.id,
    required this.title,
    required this.description,
    required this.date,
    required this.type,
    required this.read,
  });

  factory Appnotification.fromJson(Map<String, dynamic> json) {
    return Appnotification(
      id: json['ID'] ?? json['id'] ?? 0,
      title: json['title'] ?? '',
      description: json['description'] ?? 'Astrology',
      date: json['date'] ?? '0',
      type: json['type'] ?? '',
      read: json['read'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'date': date,
      'type': type,
      'read': read,
    };
  }
}
