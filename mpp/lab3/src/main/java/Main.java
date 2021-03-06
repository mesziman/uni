import controller.LoginController;
import domain.Arbiter;
import domain.Participant;
import domain.Score;
import domain.ScoreType;
import javafx.application.Application;
import javafx.fxml.FXMLLoader;
import javafx.scene.Scene;
import javafx.stage.Stage;
import repository.*;
import service.Service;
import utils.ConfigManager;

import java.io.IOException;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.List;

public class Main extends Application {
    private static ConfigManager configManager = new ConfigManager();
    private static Connection connection;
    private static IParticipantRepository participantRepository;
    private static IArbiterRepository arbiterRepository;
    private static IScoreRepository scoreRepository;
    private static Service service;

    public static void tryAddParticipant(IParticipantRepository repository, Participant participant) {
        try {
            repository.add(participant);
        } catch (RepositoryError ignored) {
        }
    }

    public static void tryAddArbiter(IArbiterRepository repository, Arbiter arbiter) {
        try {
            repository.add(arbiter);
        } catch (RepositoryError ignored) {
        }
    }

    public static void trySetScore(IScoreRepository repository, int participantId, ScoreType type, int score) {
        try {
            repository.setScore(participantId, type, score);
        } catch (RepositoryError ignored) {
        }
    }

    public static void tryPrintArbiterByNameAndPassword(IArbiterRepository repository, String name, String password) {
        try {
            Arbiter arbiter = repository.findByNameAndPassword("Cosmin Tanislav", "passwordcosmin");
            System.out.println(arbiter);
        } catch (RepositoryError ignored) {
        }
    }

    public static void tryPrintTotalScoreSortedByName(IScoreRepository repository) {
        try {
            List<Score> scores = repository.findScoresSortedByName();
            System.out.println("Total scores sorted by name");
            scores.forEach(System.out::println);
            System.out.println();
        } catch (RepositoryError ignored) {
        }
    }

    public static void tryPrintScoresForTypeSortedDescending(IScoreRepository repository, ScoreType type) {
        try {
            List<Score> scores = repository.findScoresForTypeSortedDescending(type);
            System.out.println(String.format("Scores for %s sorted descending", type.toString().toLowerCase()));
            scores.forEach(System.out::println);
            System.out.println();
        } catch (RepositoryError ignored) {
        }
    }

    public static void createConnection() {
        try {
            connection = DriverManager.getConnection(configManager.getValue("database_url"));
        } catch (SQLException e) {
            e.printStackTrace();
            System.exit(-1);
        }
    }

    public static void destroyConnection() {
        try {
            connection.close();
        } catch (SQLException e) {
            e.printStackTrace();
            System.exit(-1);
        }
    }

    public static void createParticipantRepository() {
        try {
            participantRepository = new ParticipantRepository(connection);
        } catch (RepositoryError e) {
            e.printStackTrace();
            System.exit(-1);
        }
    }

    public static void createArbiterRepository() {
        try {
            arbiterRepository = new ArbiterRepository(connection);
        } catch (RepositoryError e) {
            e.printStackTrace();
            System.exit(-1);
        }
    }

    public static void createScoreRepository() {
        try {
            scoreRepository = new ScoreRepository(connection);
        } catch (RepositoryError e) {
            e.printStackTrace();
            System.exit(-1);
        }
    }

    public static void createService() {
        service = new Service(participantRepository, arbiterRepository, scoreRepository);
    }

    public static void main(String[] args) {
        createConnection();
        createParticipantRepository();
        createArbiterRepository();
        createScoreRepository();
        createService();

        tryAddParticipant(participantRepository, new Participant("Christian Tatoiu"));
        tryAddParticipant(participantRepository, new Participant("Radu Stefanescu"));
        tryAddParticipant(participantRepository, new Participant("Nicu Serte"));
        tryAddParticipant(participantRepository, new Participant("Alexandra Suciu"));
        tryAddParticipant(participantRepository, new Participant("Silvia Suciu"));
        tryAddParticipant(participantRepository, new Participant("Adrian Sopterean"));

        tryAddArbiter(arbiterRepository, new Arbiter("Cosmin Tanislav", "passwordcosmin", ScoreType.CYCLING));
        tryAddArbiter(arbiterRepository, new Arbiter("Mihai Solcan", "passwordsolcan", ScoreType.RUNNING));
        tryAddArbiter(arbiterRepository, new Arbiter("Teodor Spiridon", "passwordrunning", ScoreType.SWIMMING));
//        tryPrintArbiterByNameAndPassword(arbiterRepository, "Cosmin Tanislav", "passwordcosmin");

        trySetScore(scoreRepository, 1, ScoreType.CYCLING, 20);
        trySetScore(scoreRepository, 1, ScoreType.RUNNING, 20);
        trySetScore(scoreRepository, 1, ScoreType.SWIMMING, 10);
        trySetScore(scoreRepository, 2, ScoreType.CYCLING, 10);
        trySetScore(scoreRepository, 2, ScoreType.RUNNING, 10);
        trySetScore(scoreRepository, 2, ScoreType.SWIMMING, 10);
        trySetScore(scoreRepository, 3, ScoreType.CYCLING, 10);
        trySetScore(scoreRepository, 3, ScoreType.RUNNING, 5);
        trySetScore(scoreRepository, 3, ScoreType.SWIMMING, 5);
        tryPrintTotalScoreSortedByName(scoreRepository);
        tryPrintScoresForTypeSortedDescending(scoreRepository, ScoreType.CYCLING);
        tryPrintScoresForTypeSortedDescending(scoreRepository, ScoreType.RUNNING);
        tryPrintScoresForTypeSortedDescending(scoreRepository, ScoreType.SWIMMING);

        launch(args);

        destroyConnection();
    }

    @Override
    public void start(Stage primaryStage) throws IOException {
        LoginController windowsController = new LoginController(service);
        FXMLLoader loader = new FXMLLoader();
        loader.setLocation(getClass().getResource(LoginController.VIEW_NAME));
        loader.setController(windowsController);

        Scene scene = new Scene(loader.load());
        primaryStage.setScene(scene);
        primaryStage.setTitle(LoginController.VIEW_TITLE);
        primaryStage.show();
    }
}
