const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const https = require('https')


let db = new sqlite3.Database(path.join(__dirname, '..', 'data', 'gutenbergindex.db'), (err) => {
    if (err) {
        console.error(err.message);
    } else {
        console.log('Connected to the gutenbergindex database.');
    }
});
const booksService = {
    async getAllBooks(limit, offset, callback) {
        const query = `SELECT books.id, name, numdownloads,COUNT(*) OVER() AS total_count,
      (SELECT name FROM downloadlinks WHERE bookid = books.id AND downloadtypeid=7) AS coverurl
    FROM books JOIN titles ON books.id = titles.bookid
    LIMIT ? OFFSET ?
`;

        db.all(query, [limit, offset], (err, rows) => {
            if (err) {
                callback(err, null);
            } else {
                try {
                    const totalCount = rows[0].total_count;
                    const books = rows.map((row) => {
                        return {
                            id: row.id,
                            title: row.name,
                            download_count: row.numdownloads,
                            cover: row.coverurl,
                        };
                    });
                    result = { 'totalCount': totalCount, 'books': books };
                    callback(null, result);
                } catch (error) {
                    console.log(error);
                    callback(error, null);
                }
            }
        });
    },

    async getBookById(id, callback) {
        db.get(`SELECT books.id,titles.name as title, numdownloads,languages.name as language, rights.name as copyright,
        (SELECT name FROM downloadlinks WHERE bookid = books.id AND downloadtypeid=7) AS coverurl
        FROM books JOIN titles ON books.id = titles.bookid JOIN rights ON books.rightsid = rights.id
        JOIN languages ON books.languageid = languages.id
        WHERE books.id = ?`, [id], (err, row) => {
            if (err) {

                callback(err, null);
            } else {
                try {
                    const book = {
                        id: row.id,
                        title: row.title,
                        download_count: row.numdownloads,
                        cover: row.coverurl,
                        copyright: row.copyright,
                        language: row.language,
                    };

                    this.getBookAuthors(id, (err, authors) => {
                        if (err) {

                            callback(err, null);
                        } else {
                            book.authors = authors;
                            this.getBookSubjects(id, (err, subjects) => {
                                if (err) {

                                    callback(err, null);
                                } else {
                                    book.subjects = subjects;
                                    callback(null, book);
                                }
                            });
                        }
                    });
                } catch (e) {
                    console.error(e.message);
                    callback(e, null);
                }
            }
        });
    },

    async getBookAuthors(id, callback) {
        const query = `SELECT authors.name
    FROM books JOIN book_authors ON books.id = book_authors.bookid
    JOIN authors ON book_authors.authorid = authors.id
    WHERE books.id = ?
    `;
        db.all(query, [id], (err, rows) => {
            if (err) {

                callback(err, null);
            } else {
                try {
                    const authors = rows.map((row) => {
                        return row.name;
                    });
                    callback(null, authors);
                } catch (error) {
                    console.log(error);
                    callback(error, []);
                }
            }
        });
    },

    async getBookSubjects(id, callback) {
        const query = `SELECT subjects.name
    FROM books JOIN book_subjects ON books.id = book_subjects.bookid
    JOIN subjects ON book_subjects.subjectid = subjects.id
    WHERE books.id = ?
    `;

        db.all(query, [id], (err, rows) => {
            if (err) {

                callback(err, null);
            } else {
                try {
                    const subjects = rows.map((row) => {
                        return row.name;
                    });
                    callback(null, subjects);
                } catch (error) {
                    console.log(error);
                    callback(error, []);
                }
            }
        }
        );
    },

    async searchBooks(searchTerm, limit, offset, callback) {
        const query = `SELECT books.id, titles.name, numdownloads,COUNT(*) OVER() AS total_count,
        (SELECT name FROM downloadlinks WHERE bookid = books.id AND downloadtypeid=7) AS coverurl
        FROM books JOIN titles ON books.id = titles.bookid
        WHERE titles.name LIKE '%${searchTerm}%'
        LIMIT ? OFFSET ?
    `;
        db.all(query, [limit, offset], (err, rows) => {
            if (err) {

                callback(err, null);
            } else {
                try {
                    const totalCount = rows[0].total_count;
                    const books = rows.map((row) => {
                        return {
                            id: row.id,
                            title: row.name,
                            download_count: row.numdownloads,
                            cover: row.coverurl,
                        };
                    });
                    result = { 'totalCount': totalCount, 'books': books };
                    callback(null, result);
                } catch (e) {
                    callback(e, null);
                }
            }
        });
    },

    async getAllSubjects(limit, offset, callback) {
        const query = `SELECT subjects.name
        FROM books JOIN book_subjects ON books.id = book_subjects.bookid
        JOIN subjects ON book_subjects.subjectid = subjects.id
        GROUP BY subjects.name LIMIT ? OFFSET ?
       
    `;
        db.all(query, [limit, offset], (err, rows) => {
            if (err) {

                callback(err, null);
            } else {
                try {
                    const subjects = rows.map((row) => {
                        return row.name;
                    });
                    console.log(subjects);
                    callback(null, subjects);
                } catch (e) {
                    callback(e, null);
                }
            }
        });
    }
    ,
    async getBooksBySubject(subject, limit, offset, callback) {
        const query = `SELECT books.id, titles.name, numdownloads,COUNT(*) OVER() AS total_count,
        (SELECT name FROM downloadlinks WHERE bookid = books.id AND downloadtypeid=7) AS coverurl
        FROM books JOIN book_subjects ON books.id = book_subjects.bookid
        JOIN subjects ON book_subjects.subjectid = subjects.id
        JOIN titles ON books.id = titles.bookid
        WHERE subjects.name = '${subject}'
        LIMIT ? OFFSET ?
    `;
        db.all(query, [limit, offset], (err, rows) => {
            if (err) {

                callback(err, null);
            } else {
                try {
                    const totalCount = rows[0].total_count;
                    const books = rows.map((row) => {
                        return {
                            id: row.id,
                            title: row.name,
                            download_count: row.numdownloads,
                            cover: row.coverurl,
                        };
                    });
                    result = { 'totalCount': totalCount, 'books': books };
                    callback(null, result);
                } catch (e) {
                    callback(e, null);
                }
            }
        });
    },


    async getBookText(bookId, callback) {
        const query = `SELECT name FROM books JOIN downloadlinks ON books.id = downloadlinks.bookid
    and downloadlinks.downloadtypeid = 5
    WHERE books.id = ?
    `;
        db.get(query, [bookId], (err, row) => {
            if (err) {

                callback(err, null);
            } else {
                try {
                    https.get(row.name, (resp) => {
                        let data = '';
                        resp.on('data', (chunk) => {
                            data += chunk;
                        });
                        resp.on('end', () => {
                            callback(null, data);
                        });
                    }).on("error", (err) => {
                        console.log("Error: " + err.message);
                        callback(err, null);
                    });
                } catch (error) {
                    console.log(error);
                    callback(error, null);
                }
            }
        });
    },
    async closeDb() {
        db.close((err) => {
            if (err) {

            }
            console.log('Close the database connection.');
        });
    }
};
module.exports = booksService;
