import mariadb from "../../../config/mariadb";

interface request {
  notiCategoryNum?: number;
  senderNickname?: string;
  recipientNickname?: string;
  url?: string;
}

interface response {
  success: boolean;
}

interface notification {
  num: number;
  senderNickname: string;
  notiCategoryNum: number;
  inDate: string;
  boardTitle: string;
  readFlag: number;
}

class NotificationStorage {
  static async create(
    boardNum: number,
    req: request,
    purchaseBoardNum?: number
  ): Promise<response> {
    let conn;

    try {
      conn = await mariadb.getConnection();

      const notification = await conn.query(
        `INSERT INTO notifications (board_no, noti_category_no, sender_nickname, recipient_nickname, email, url) 
        VALUES (?, ?, ?, ?, (SELECT email FROM students WHERE nickname = '${req.recipientNickname}'), ?);`,
        [
          boardNum ? boardNum : purchaseBoardNum,
          req.notiCategoryNum,
          req.senderNickname,
          req.recipientNickname,
          req.url,
        ]
      );

      if (notification.affectedRows) {
        return { success: true };
      }
      return { success: false };
    } catch (err) {
      throw err;
    } finally {
      conn?.release();
    }
  }

  static async findOneByNickname(req: request): Promise<string> {
    let conn;

    try {
      conn = await mariadb.getConnection();

      const response = await conn.query(
        `SELECT email FROM students WHERE nickname = ?;`,
        [req.recipientNickname]
      );

      return response[0].email;
    } catch (err) {
      throw err;
    } finally {
      conn?.release();
    }
  }

  static async findOneByBoardNum(boardNum: number): Promise<string> {
    let conn;

    try {
      conn = await mariadb.getConnection();

      const response = await conn.query(
        `SELECT title FROM boards WHERE no = ?`,
        [boardNum]
      );

      return response[0].title;
    } catch (err) {
      throw err;
    } finally {
      conn?.release();
    }
  }

  static async findAllbyNickname(studentId: string): Promise<notification[]> {
    let conn;

    try {
      conn = await mariadb.getConnection();

      const notifications = await conn.query(
        `SELECT no.no AS notificationNum, no.sender_nickname AS senderNickname, no.noti_category_no AS notiCategoryNum, bo.title AS boardTitle,
        no.read_flag AS readFlag, no.url, date_format(no.in_date, '%Y-%m-%d %H:%i:%s') AS inDate 
        FROM notifications no
        JOIN boards bo
        ON bo.no = no.board_no
        WHERE bo.student_id = ?
        ORDER BY inDate DESC
        LIMIT 20;`,
        [studentId]
      );

      const notification: notification[] = Object.values(
        JSON.parse(JSON.stringify(notifications))
      );

      return notification;
    } catch (err) {
      throw err;
    } finally {
      conn?.release();
    }
  }

  static async updateReadFlag(notificationNum: number): Promise<number> {
    let conn;

    try {
      conn = await mariadb.getConnection();

      const updateInfo = await conn.query(
        "UPDATE notifications SET read_flag = 1 WHERE no = ?;",
        [notificationNum]
      );

      return updateInfo.affectedRows;
    } catch (err) {
      throw err;
    } finally {
      conn?.release();
    }
  }
}

export default NotificationStorage;
